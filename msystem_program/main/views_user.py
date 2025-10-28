from django.shortcuts import render, redirect, get_object_or_404
from .models import Products, Customers, Category, SubCategory
from django.contrib import messages
from django.contrib.auth.hashers import make_password, check_password

def home_user(request):
    return render(request, "main/user/home.html")

def about(request):
    return render(request, "main/user/about.html")

def account(request):
    if request.method == "POST":
        name = request.POST.get("user_name")
        email = request.POST.get("user_email")
        password = request.POST.get("user_password")
        print("Received User Credentials:", name, email, password)

        # check if email already exists
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