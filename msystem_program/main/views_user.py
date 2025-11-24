from django.shortcuts import render, redirect, get_object_or_404
from .models import Products, Customers, Category, SubCategory, BrowsingHistory
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password
from functools import wraps
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone


def login_required_custom(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if "customer_id" not in request.session:
            return redirect("account")
        return view_func(request, *args, **kwargs)
    return wrapper

def home_user(request):
    categories = Category.objects.all()

    request.session.get("user_id")

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
        
        else:  
            try:
                customer = Customers.objects.get(user_email=email)
                if check_password(password, customer.user_password):
                  
                    messages.success(request, f"Welcome back, {customer.user_name}!")
                    request.session["customer_id"] = customer.user_id
                    request.session["customer_name"] = customer.user_name
                    request.session["customer_email"] = customer.user_email
                    print("Session customer_id:", request.session.get("customer_id"))

                    return redirect('profile')
                else:
                    return render(request, "main/user/account.html", {
                        "login_error": "Incorrect password!"
                    })
            except Customers.DoesNotExist:
                return render(request, "main/user/account.html", {
                    "login_error": "Email not registered!"
                })
    
    return render(request, "main/user/account.html")

@login_required_custom
def logout_user(request):
    logout(request)
    if "user_id" in request.session:
        del request.session["user_id"]

    messages.success(request, "You have logged out successfully.")
    return redirect("home_user")


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

@login_required_custom
def profile(request):
    user_id = request.session.get("customer_id")
    customer = Customers.objects.get(user_id=user_id)

    if request.method == "POST":
        customer.user_name = request.POST.get("user_name")
        customer.user_email = request.POST.get("user_email")
        customer.user_phone = request.POST.get("user_phone")
        customer.user_address = request.POST.get("user_address")
        customer.user_city = request.POST.get("user_city")
        customer.user_province = request.POST.get("user_province")
        customer.user_zip = request.POST.get("user_zip")
        customer.user_birthdate = request.POST.get("user_birthdate") or None
        customer.user_gender = request.POST.get("user_gender")
        customer.user_notes = request.POST.get("user_notes")

        print("user_name:", customer.user_name)
        print("user_email:", customer.user_email)
        print("user_phone:", customer.user_phone)
        print("user_address:", customer.user_address)
        print("user_birthdate:", customer.user_birthdate) 
        print("user_gender:", customer.user_gender)
        print("user_notes:", customer.user_notes)
        customer.save()

        return redirect("home_user")  

    return render(request, "main/user/account_login.html", {
        "user_name": customer.user_name,
        "user_email": customer.user_email,
        "user_phone": customer.user_phone,
        "user_address": customer.user_address,
        "user_city": customer.user_city,
        "user_province": customer.user_province,
        "user_zip": customer.user_zip,
        "user_birthdate": customer.user_birthdate,
        "user_gender": customer.user_gender,
        "user_notes": customer.user_notes
    })


# ==== BROWSING HISTORY ====
MAX_HISTORY = 30  # max items per user

@csrf_exempt
def save_browsing_history(request):
    products = Products.objects.all()
    print("save_browsing_history called")  # DEBUG

    if request.method == "POST":
        user_id = request.session.get("customer_id")
        product_id = request.POST.get("product_id")
        print(f"POST data - user_id: {user_id}, product_id: {product_id}")  # DEBUG

        if not user_id or not product_id:
            print("Missing data")  # DEBUG
            return JsonResponse({"status": "error", "message": "Missing data"})

        try:
            user = Customers.objects.get(pk=user_id)
            product = Products.objects.get(pk=product_id)
            print(f"User: {user.user_name}, Product: {product.item_name}")  # DEBUG

            # Check if the product is already in the user's history (no duplicates allowed)
            existing = BrowsingHistory.objects.filter(user_id=user, item_id=product).first()
            if existing:
                existing.viewed_at = timezone.now()
                existing.save()
                print(f"Updated existing history for product {product.item_name}")  # DEBUG
            else:
                BrowsingHistory.objects.create(user_id=user, item_id=product)
                print(f"Created new history for product {product.item_name}")  # DEBUG

            # Ensure history limit (by using QUEUE FIFO)
            history_count = BrowsingHistory.objects.filter(user_id=user).count()
            print(f"User history count: {history_count}")  # DEBUG
            if history_count > MAX_HISTORY:
                oldest = BrowsingHistory.objects.filter(user_id=user).order_by('viewed_at')[:history_count - MAX_HISTORY]
                print(f"Deleting {oldest.count()} oldest history items")  # DEBUG
                oldest.delete()

            return JsonResponse({"status": "success"})

        except Customers.DoesNotExist:
            print("User not found")  # DEBUG
            return JsonResponse({"status": "error", "message": "User not found"})
        except Products.DoesNotExist:
            print("Product not found")  # DEBUG
            return JsonResponse({"status": "error", "message": "Product not found"})

    print("Invalid request")  # DEBUG
    return JsonResponse({"status": "error", "message": "Invalid request"})


def get_browsing_history(request):
    user_id = request.session.get("customer_id")

    if not user_id:
        return JsonResponse({"status": "error", "message": "User not logged in"})

    history_items = BrowsingHistory.objects.filter(user_id=user_id).order_by('-viewed_at')

    products = [item.item_id for item in history_items]

    return render(request, "main/user/product.html", {
        "products": products
    })