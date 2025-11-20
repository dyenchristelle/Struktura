from django.shortcuts import render, redirect, get_object_or_404
from .models import Products, Customers, Category, SubCategory
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password

def home_user(request):
    categories = Category.objects.all()

    context = {
        'categories': categories,
    }
    return render(request, "main/user/home.html", context)

def about(request):
    return render(request, "main/user/about.html")

def account(request):
    if request.method == "POST":
        name = request.POST.get("user_name")
        email = request.POST.get("user_email")
        password = request.POST.get("user_password")
        print("Received User Credentials:", name, email, password)

        # check if email already exists
        if name:
            if Customers.objects.filter(user_email=email).exists():
                return render(request, "main/user/account.html", {
                    "error": "Email already registered!"
                })

        # create a new customer
            customer = Customers(
                user_name=name,
                user_email=email,
                user_password=make_password(password)
            )
            customer.save()
            messages.success(request, "Account created successfully! Please log in.")
            return render(request, "main/user/account.html", {
                    "success": "true",
                    "name": name
                })
        
        else:  # Login (no name field)
            try:
                customer = Customers.objects.get(user_email=email)
                if check_password(password, customer.user_password):
                    # Password matches! Login successful
                    messages.success(request, f"Welcome back, {customer.user_name}!")
                    # You can redirect to a dashboard or home page here
                    return redirect('home_user')
                else:
                    # Password does not match
                    return render(request, "main/user/account.html", {
                        "login_error": "Incorrect password!"
                    })
            except Customers.DoesNotExist:
                return render(request, "main/user/account.html", {
                    "login_error": "Email not registered!"
                })
    
    return render(request, "main/user/account.html")

def contact(request):
    return render(request, "main/user/contact.html")

def faq(request):
    return render(request, "main/user/faq.html")

def help_center(request):
    return render(request, "main/user/help-center.html")

def privacy(request):
    return render(request, "main/user/privacy.html")

def return_page(request):
    return render(request, "main/user/return.html")

def security(request):
    return render(request, "main/user/security.html")

def terms(request):
    return render(request, "main/user/terms.html")


# ==== PRODUCTS PAGE ====
class TreeNode:
    def __init__(self, name, obj=None):
        self.name = name      # category, subcategory, or product name
        self.obj = obj        # store model object
        self.children = []    # child TreeNodes


def products_page(request, category=None):
    categories = Category.objects.all()
    
    if category:
        # get Category object by name (case-insensitive)
        selected_category = get_object_or_404(Category, name__iexact=category)
        products = Products.objects.filter(item_category=selected_category)
    else:
        selected_category = None
        products = Products.objects.all()

    # Build category tree
    category_tree = []
    for cat in categories:
        cat_node = TreeNode(cat.name, obj=cat)
        subcategories = SubCategory.objects.filter(category=cat)
        for sub in subcategories:
            sub_node = TreeNode(sub.name, obj=sub)
            products_in_sub = Products.objects.filter(item_category=cat, subcategory=sub)
            for prod in products_in_sub:
                prod_node = TreeNode(prod.item_name, obj=prod)
                sub_node.children.append(prod_node)
            cat_node.children.append(sub_node)
        category_tree.append(cat_node)

    context = {
        "categories": categories,
        "products": products,
        "category_tree": category_tree,
        "selected_category": selected_category,
    }
    return render(request, "main/user/product.html", context)


# def products_page(request, category=None):
#     categories = Category.objects.all()

#     if category:
#         # Convert slug back to normal name
#         category_name = category.replace('-', ' ')
#         category_obj = get_object_or_404(Category, name__iexact=category_name)
#         products = Products.objects.filter(item_category=category_obj)
#         selected_category = category_obj.id
#     else:
#         products = Products.objects.all()
#         selected_category = None

#     context = {
#         'categories': categories,
#         'products': products,
#         'selected_category': selected_category,
#     }
#     return render(request, "main/user/product.html", context)
