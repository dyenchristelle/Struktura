from django.shortcuts import render, redirect, get_object_or_404
from .models import Products, Customers, Category, SubCategory, BrowsingHistory, UserCart, UserOrder
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password
from functools import wraps
from django.contrib.auth import authenticate, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone
from django.views.decorators.http import require_POST
from django.db import transaction


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


# ==== account signup/login
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

# ==== logout ====
@login_required_custom
def logout_user(request):
    request.session.pop("customer_id", None)

    messages.success(request, "You have logged out successfully.")
    return redirect("account")


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


def products_page(request, category=None, subcategory=None):
    categories = Category.objects.all()

    selected_category = None
    selected_subcategory = None

    products = Products.objects.all()  # default

    # category selected
    if category:
        selected_category = get_object_or_404(Category, name__iexact=category)
        products = products.filter(item_category=selected_category)

    # subcategory selected
    if subcategory:
        selected_subcategory = get_object_or_404(SubCategory, name__iexact=subcategory)
        products = products.filter(subcategory=selected_subcategory)

    # for subcategory bar
    if selected_category:
        subcategories = SubCategory.objects.filter(category=selected_category)
    else:
        subcategories = None

    # Build category tree (Admin UI)
    category_tree = []
    for cat in categories:
        cat_node = TreeNode(cat.name, obj=cat)
        subs = SubCategory.objects.filter(category=cat)
        for sub in subs:
            sub_node = TreeNode(sub.name, obj=sub)
            products_in_sub = Products.objects.filter(item_category=cat, subcategory=sub)
            for prod in products_in_sub:
                prod_node = TreeNode(prod.item_name, obj=prod)
                sub_node.children.append(prod_node)
            cat_node.children.append(sub_node)
        category_tree.append(cat_node)

    return render(request, "main/user/product.html", {
        "categories": categories,
        "products": products,
        "subcategories": subcategories,
        "selected_category": selected_category,
        "selected_subcategory": selected_subcategory,
        "category_tree": category_tree,
    })



# ==== account profile ====
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
MAX_HISTORY = 30

@require_POST
def save_browsing_history(request):
    print("save_browsing_history called")

    user_id = request.session.get("customer_id")
    product_id = request.POST.get("product_id")
    print(f"POST data - user_id: {user_id}, product_id: {product_id}")

    if not user_id or not product_id:
        print("Missing data")
        return JsonResponse({
            "status": "error", 
            "message": "Missing user_id or product_id"
        }, status=400)

    try:
        user = Customers.objects.get(pk=user_id)
        product = Products.objects.get(pk=product_id)
        print(f"User: {user.user_name}, Product: {product.item_name}")

        # update timestamp if product already exist
        existing = BrowsingHistory.objects.filter(user_id=user, item_id=product).first()
        if existing:
            existing.viewed_at = timezone.now()
            existing.save()
            print(f"Updated timestamp {existing.viewed_at}")
            action = "updated"
        else:
            BrowsingHistory.objects.create(user_id=user, item_id=product)
            action = "created"

        # FIFO
        history_items = BrowsingHistory.objects.filter(user_id=user).order_by('viewed_at')
        if history_items.count() > MAX_HISTORY:
            delete_count = history_items.count() - MAX_HISTORY
            oldest = history_items[:delete_count]
            print(f"Deleting {delete_count} oldest items")
            oldest.delete()

        return JsonResponse({
            "status": "success",
            "product_id": product_id,
            "product_name": product.item_name,
            "action": action
        })

    except Customers.DoesNotExist:
        print("Customer not found")
        return JsonResponse({
            "status": "error",
            "message": "Customer not found"
        }, status=404)
    
    except Products.DoesNotExist:
        print("Product not found")
        return JsonResponse({
            "status": "error",
            "message": "Product not found"
        }, status=404)
    
    except Exception as e:
        print("Error:", e)
        return JsonResponse({
            "status": "error",
            "message": str(e)
        }, status=500)


def get_browsing_history(request):
    user_id = request.session.get("customer_id")
    if not user_id:
        return JsonResponse({"status": "error", "message": "User not logged in"})

    user = Customers.objects.get(pk=user_id)
    history_items = BrowsingHistory.objects.filter(user_id=user).order_by('-viewed_at')

    # Get Product objects in order
    recent = [h.item_id for h in history_items]  
    print("Recent products for user:", [p.item_name for p in recent]) 

    return render(request, "main/user/recent.html", {
        "recent": recent
    })



# ==== SEARCH ====
def search_products(request):
    search_query = request.GET.get('search', '')

    if search_query:
        products = Products.objects.filter(item_name__icontains=search_query)
    else:
        products = Products.objects.all()  # or none()

    return render(request, 'main/user/search.html', {
        'search_query': search_query,
        'products': products
    })


# ==== CART ====
def get_cart_from_session(request):
    """
    Get cart stored in session for guest users.
    Structure:
    request.session['cart'] = {
        product_id: {
            'name': 'Product Name',
            'price': 999.00,
            'quantity': 2,
            'image': '/path/to/img.jpg'
        },
        ...
    }
    """
    return request.session.get('cart', {})

def save_cart_to_session(request, cart):
    request.session['cart'] = cart
    request.session.modified = True

@csrf_exempt
def add_to_cart(request):
    if request.method != "POST":
        return JsonResponse({"status": "error", "message": "Invalid method."})

    product_id = request.POST.get("product_id")
    quantity = int(request.POST.get("quantity", 1))
    user_id = request.session.get("customer_id")

    product = Products.objects.get(item_id=product_id)

    if user_id:  # logged-in user → save in DB
        cart_item, created = UserCart.objects.get_or_create(
            user_id_id=user_id,
            item_id=product,
            defaults={'order_quantity': quantity, 'order_price': product.item_price}
        )
        if not created:
            cart_item.order_quantity += quantity
            cart_item.save()
    else:  # guest user → save in session
        cart = get_cart_from_session(request)
        if product_id in cart:
            cart[product_id]['quantity'] += quantity
        else:
            cart[product_id] = {
                'name': product.item_name,
                'price': float(product.item_price),
                'quantity': quantity,
                'image': product.item_image.url if product.item_image else ''
            }
        save_cart_to_session(request, cart)

    return JsonResponse({"status": "success"})


    
def user_cart(request):
    user_id = request.session.get("customer_id")

    if user_id:  # logged-in → DB
        cart_items = UserCart.objects.filter(user_id_id=user_id).select_related('item_id')
        cart_total = sum(item.subtotal() for item in cart_items)
        return render(request, 'main/user/cart.html', {
            'cart_items': cart_items,
            'cart_total': cart_total,
            'is_guest': False
        })
    else:  # guest → session
        session_cart = get_cart_from_session(request)
        cart_total = sum(item['price'] * item['quantity'] for item in session_cart.values())
        return render(request, 'main/user/cart.html', {
            'cart_items': session_cart,
            'cart_total': cart_total,
            'is_guest': True
        })


# ==== CHECKOUT ====

def checkout(request):
    user_id = request.session.get("customer_id")

    if not user_id:
        messages.info(request, "Please log in to checkout")
        return redirect("login")

    cart_items = UserCart.objects.filter(user_id_id=user_id).select_related("item_id")

    if not cart_items.exists():
        messages.error(request, "Your cart is empty.")
        return redirect("user_cart")

    with transaction.atomic():
        for cart in cart_items:
            product = cart.item_id
            if product.quantity < cart.order_quantity:
                messages.error(request, f"Not enough stock for {product.item_name}.")
                return redirect("user_cart")

            product.quantity -= cart.order_quantity
            product.save()

            UserOrder.objects.create(
                user_id=cart.user_id,
                product_id=product,
                order_quantity=cart.order_quantity,
                order_price=product.item_price
            )

        cart_items.delete()

    messages.success(request, "Checkout successful!")
    return redirect("order_success")