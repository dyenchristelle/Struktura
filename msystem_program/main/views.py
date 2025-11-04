from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from .models import Products, Customers, Category, SubCategory
from decimal import Decimal
from django.contrib.auth.models import User
from functools import wraps

# last edit: 10/24/25


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

def login_required_custom(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if "user" not in request.session:
            return redirect("login")
        return view_func(request, *args, **kwargs)
    return wrapper


# LOGOUT
@login_required_custom
def logout_user(request):
    request.session.flush()
    return redirect("login")

#  HOMEPAGE
def home_page(request):
    categories = Category.objects.all()
    return render(request, 'main/admin/home.html', {'categories': categories})

# SEARCH
def search_view(request):
    search_query = request.GET.get('search', '') 
    return render(request, 'main/admin/home.html', {'search_query': search_query})



# === ADD PRODUCT ===
@login_required_custom
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
    
        # return redirect("products")
    
    return render(request, "main/admin/add_product.html")

# ===== UPDATE PRODUCT =====
@login_required_custom
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
@login_required_custom
def delete_product(request, product_id):
    product = get_object_or_404(Products, pk=product_id)
    category = product.item_category
    if request.method == "POST":
        product.delete()
        return redirect("category", category.name)
    return render(request, "main/admin/delete_product.html", {"product": product, "category": category, })

# ===== CUSTOMERS PAGE =====
@login_required_custom
def customers_page(request):
    customers = Customers.objects.all()
    return render(request, "main/admin/customers.html", {"customers": customers})

# ===== DELETE CUSTOMER =====
@login_required_custom
def delete_customer(request, customer_id):
    customer = get_object_or_404(Customers, pk=customer_id)
    if request.method == "POST":
        customer.delete()
        return redirect("customers")
    return render(request, "main/admin/delete_customer.html", {"customer": customer})


class TreeNode:
    def __init__(self, name, obj=None):
        self.name = name     # category, subcategory, or product name
        self.obj = obj       # store model object
        self.children = []   # list of child TreeNode

# ===== CATEGORY PAGE =====
@login_required_custom
def category_page(request, category):
    products = Products.objects.filter(item_category__name=category)

    category_obj = Category.objects.get(name=category)
    root_node = TreeNode(category_obj.name, obj=category_obj)

    subcategories = SubCategory.objects.filter(category=category_obj)
    for sub in subcategories:
        sub_node = TreeNode(sub.name, obj=sub)
        products_in_sub = Products.objects.filter(item_category=category_obj, subcategory=sub)
        for prod in products_in_sub:
            prod_node = TreeNode(prod.item_name, obj=prod)
            sub_node.children.append(prod_node)
        root_node.children.append(sub_node)

    return render(request, "main/admin/category.html", {
        "category": category,
        "products": products,
        "category_tree": root_node,
    })


@login_required_custom
def subcategory_page(request, category, subcategory):
    products = Products.objects.filter(
        item_category__name=category, subcategory__name__iexact=subcategory
    )

    category_obj = Category.objects.get(name=category)
    root_node = TreeNode(category_obj.name, obj=category_obj)

    subcategories = SubCategory.objects.filter(category=category_obj)
    for sub in subcategories:
        sub_node = TreeNode(sub.name, obj=sub)
        products_in_sub = Products.objects.filter(item_category=category_obj, subcategory=sub)
        for prod in products_in_sub:
            prod_node = TreeNode(prod.item_name, obj=prod)
            sub_node.children.append(prod_node)
        root_node.children.append(sub_node)

    return render(request, "main/admin/subcategory.html", {
        "category_tree": root_node, 
        "category": category_obj,     
        "subcategory": SubCategory.objects.get(name=subcategory, category=category_obj),
        "products": products,
    })