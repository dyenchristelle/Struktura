from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .models import Products, Customers, Category, SubCategory
from decimal import Decimal
from django.contrib.auth.models import User
from functools import wraps
from django.db.models import Q


def admin_login(request):
    error = None
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        if username == "admin" and password == "admin123":
            request.session["user"] = username
            return redirect("home")
        else:
            error = "Invalid username or password."
    return render(request, "main/admin/base.html", {"error": error})
    # if request.method == "POST":
    #     username = request.POST.get("username")
    #     password = request.POST.get("password")

    #     try:
    #         if AdminLogin.objects.filter(username=username, password=password).exists():
    #             return redirect("admin-homepage")
    #     except AdminLogin.DoesNotExist:
    #         return render(request, "main/admin/admin-index.html", {"error": "Invalid username or password"})
        
    # return render(request, "main/admin/admin-index.html")

def admin_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if "user" not in request.session:
            return redirect("login")
        return view_func(request, *args, **kwargs)
    return wrapper


# LOGOUT
@admin_required
def logout_admin(request):
    request.session.pop("admin", None)
    return redirect("login")

#  HOMEPAGE
def home_page(request):
    categories = Category.objects.all()

    search_query = request.GET.get("search", "")
    products = None

    if search_query:
        products = Products.objects.filter(
            Q(item_name__icontains=search_query) | 
            Q(item_description__icontains=search_query)
        ).order_by('item_name')  # sort by name
    else:
        products = None  # default when no search yet

    context = {
        'categories': categories,
        'products': products,
        'search_query': search_query,
    }

    return render(request, 'main/admin/home.html', context)

# SEARCH
def search_view(request):
    search_query = request.GET.get('search', '')

    if search_query:
        products = Products.objects.filter(item_name__icontains=search_query)
    else:
        products = Products.objects.none()   

    return render(request, 'main/admin/search.html', {'search_query': search_query,'products': products})



# === ADD PRODUCT ===
@admin_required
def add_product(request):
    print("add_product view called")
    if request.method == "POST":
        name = request.POST.get("product_name")
        quantity = request.POST.get("product_quantity")
        price = request.POST.get("product_price")
        description = request.POST.get("product_description")
        category_id = request.POST["category_name"]
        subcategory = request.POST["subcategory_id"]
        image = request.FILES.get("product_image")
        print("Received POST data:", name, quantity, price, category_id, subcategory, image, description)

        try:
            quantity = int(quantity)
            price = Decimal(price)
            category_obj = Category.objects.get(pk=int(category_id))
            subcategory_obj = None
            if subcategory:
                subcategory_obj = SubCategory.objects.get(pk=int(subcategory))
            Products.objects.create(
                item_name=name,
                item_quantity=quantity,
                item_price=price,
                item_description=description,
                item_category=category_obj,
                subcategory=subcategory_obj, 
                item_image=image
            )
            print("Item added.")
            return redirect("add_product")
        except Exception as e:
            print("Error adding product.", repr(e))
            return render(request, "main/admin/home.html", {"error": f"Could not add product: {e}"})
    
    return render(request, "main/admin/add_product.html")

# ===== UPDATE PRODUCT =====
@admin_required
def update_product(request, product_id):
    product = get_object_or_404(Products, pk=product_id)
    category = product.item_category
    if request.method == "POST":
        product.item_name = request.POST.get("product_name")
        product.item_quantity = int(request.POST.get("product_quantity"))
        product.item_price = Decimal(request.POST.get("product_price"))
        product.save()
        return redirect("category", category.name)
    return render(request, "main/admin/update_product.html", {"product": product, "category": category,})

# ===== DELETE PRODUCT =====
@admin_required
def delete_product(request, product_id):
    product = get_object_or_404(Products, pk=product_id)
    category = product.item_category
    if request.method == "POST":
        product.delete()
        return redirect("category", category.name)
    return render(request, "main/admin/delete_product.html", {"product": product, "category": category, })

# ===== CUSTOMERS PAGE =====
@admin_required
def customers_page(request):
    customers = Customers.objects.all()
    return render(request, "main/admin/customers.html", {"customers": customers})

# ===== DELETE CUSTOMER =====
@admin_required
def delete_customer(request, customer_id):
    customer = get_object_or_404(Customers, pk=customer_id)
    if request.method == "POST":
        customer.delete()
        return redirect("customers")
    return render(request, "main/admin/delete_customer.html", {"customer": customer})



# ==== Product Category ====
class TreeNode:
    def __init__(self, name, obj=None):
        self.name = name
        self.obj = obj
        self.children = []


@admin_required
def category_page(request, category):
    category_obj = Category.objects.get(name=category)

    subcategories = list(SubCategory.objects.filter(category=category_obj))

    products = list(
        Products.objects.filter(item_category=category_obj)
        .select_related("subcategory")
    )

    sub_to_products = {sub: [] for sub in subcategories}

    # group products under their subcategory
    for prod in products:
        if prod.subcategory in sub_to_products:
            sub_to_products[prod.subcategory].append(prod)

    root_node = TreeNode(category_obj.name, obj=category_obj)

    for sub in subcategories:
        sub_node = TreeNode(sub.name, obj=sub)
        for prod in sub_to_products[sub]:
            prod_node = TreeNode(prod.item_name, obj=prod)
            sub_node.children.append(prod_node)
        root_node.children.append(sub_node)

    return render(request, "main/admin/category.html", {
        "category": category,
        "products": products,
        "category_tree": root_node,
    })



@admin_required
def subcategory_page(request, category, subcategory):
    # get category
    category_obj = Category.objects.get(name=category)

    # get all subcategories under this category
    subcategories = list(SubCategory.objects.filter(category=category_obj))

    # get ALL products under this category
    products = list(
        Products.objects.filter(item_category=category_obj)
        .select_related("subcategory")
    )

    # group products by subcategory (O(n))
    sub_to_products = {sub: [] for sub in subcategories}
    for prod in products:
        if prod.subcategory in sub_to_products:
            sub_to_products[prod.subcategory].append(prod)

    # Build the category tree (same as category_page)
    root_node = TreeNode(category_obj.name, obj=category_obj)

    for sub in subcategories:
        sub_node = TreeNode(sub.name, obj=sub)
        for prod in sub_to_products[sub]:
            prod_node = TreeNode(prod.item_name, obj=prod)
            sub_node.children.append(prod_node)
        root_node.children.append(sub_node)

    selected_subcategory = next((s for s in subcategories if s.name.lower() == subcategory.lower()), None)
    products_in_sub = sub_to_products.get(selected_subcategory, [])

    return render(request, "main/admin/subcategory.html", {
        "category_tree": root_node,
        "category": category_obj,
        "subcategory": selected_subcategory,
        "products": products_in_sub,
    })
