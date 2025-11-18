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

class TreeNode:
    def __init__(self, name, obj=None):
        self.name = name     # category, subcategory, or product name
        self.obj = obj       # store model object
        self.children = []   # list of child TreeNode

# ===== CATEGORY PAGE =====
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

# ==== SUBCATEGORY ====
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