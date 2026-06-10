"""
Seed script: generates 100 realistic customers and 500 orders.
Run: python seed_data.py
"""

import asyncio
import random
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import uuid
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "crm_db")

FIRST_NAMES = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
    "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Advaith",
    "Divya", "Ananya", "Priya", "Shreya", "Pooja", "Sneha", "Kavya", "Meera",
    "Riya", "Nisha", "Simran", "Tanvi", "Isha", "Kritika", "Ankita",
    "Rahul", "Rohit", "Amit", "Vikram", "Suresh", "Rajesh", "Nitin", "Karan",
    "Varun", "Arun", "Deepak", "Manish", "Pankaj", "Sanjay", "Ramesh",
    "Kavita", "Sunita", "Rekha", "Geeta", "Lata", "Usha", "Mala", "Seema",
    "Neha", "Swati", "Jyoti", "Archana", "Shweta", "Pallavi", "Preeti"
]

LAST_NAMES = [
    "Sharma", "Verma", "Patel", "Singh", "Kumar", "Gupta", "Joshi", "Mehta",
    "Shah", "Reddy", "Nair", "Iyer", "Pillai", "Menon", "Rao", "Bose",
    "Chatterjee", "Banerjee", "Das", "Sen", "Mukherjee", "Ghosh", "Roy",
    "Malhotra", "Kapoor", "Aggarwal", "Agarwal", "Jain", "Bajaj", "Khanna"
]

CITIES = [
    "Mumbai", "Delhi", "Bangalore", "Chennai", "Hyderabad", "Kolkata",
    "Pune", "Ahmedabad", "Jaipur", "Lucknow", "Surat", "Kochi",
    "Chandigarh", "Indore", "Nagpur", "Bhopal", "Vadodara", "Coimbatore"
]

PRODUCTS = [
    {"name": "Running Shoes", "price": 2499},
    {"name": "Casual T-Shirt", "price": 599},
    {"name": "Jeans", "price": 1299},
    {"name": "Formal Shirt", "price": 899},
    {"name": "Sneakers", "price": 3499},
    {"name": "Kurti", "price": 799},
    {"name": "Saree", "price": 2199},
    {"name": "Backpack", "price": 1499},
    {"name": "Sunglasses", "price": 699},
    {"name": "Watch", "price": 4999},
    {"name": "Handbag", "price": 1899},
    {"name": "Laptop Bag", "price": 1199},
    {"name": "Ethnic Wear", "price": 1599},
    {"name": "Sports Shorts", "price": 499},
    {"name": "Hoodie", "price": 1099},
    {"name": "Blazer", "price": 2899},
    {"name": "Leggings", "price": 449},
    {"name": "Sandals", "price": 799},
    {"name": "Belt", "price": 349},
    {"name": "Cap", "price": 299},
]


def random_date(start_days_ago: int, end_days_ago: int = 0) -> datetime:
    delta = random.randint(end_days_ago, start_days_ago)
    return datetime.utcnow() - timedelta(days=delta)


def gen_phone() -> str:
    return f"+91 {random.randint(7000000000, 9999999999)}"


async def seed():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    # Clear existing data
    await db.customers.drop()
    await db.orders.drop()
    await db.delivery_receipts.drop()

    print("🌱 Seeding customers...")
    customers = []
    used_emails = set()

    for i in range(100):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        
        email_base = f"{first.lower()}.{last.lower()}"
        email = f"{email_base}{random.randint(1, 999)}@example.com"
        while email in used_emails:
            email = f"{email_base}{random.randint(1, 9999)}@example.com"
        used_emails.add(email)

        customer = {
            "customer_id": f"CUST-{uuid.uuid4().hex[:8].upper()}",
            "name": name,
            "email": email,
            "phone": gen_phone(),
            "city": random.choice(CITIES),
            "joined_at": random_date(365, 10),
        }
        customers.append(customer)

    await db.customers.insert_many(customers)
    print(f"✅ Inserted {len(customers)} customers")

    # Create indexes
    await db.customers.create_index("customer_id", unique=True)
    await db.customers.create_index("email", unique=True)

    print("🌱 Seeding orders...")
    orders = []

    # Distribute 500 orders across 100 customers
    # Some customers are heavy buyers, some light
    customer_order_counts = {}
    for c in customers:
        # Pareto distribution: 20% customers make 80% orders
        if random.random() < 0.2:
            count = random.randint(8, 20)
        elif random.random() < 0.5:
            count = random.randint(3, 7)
        else:
            count = random.randint(0, 2)
        customer_order_counts[c["customer_id"]] = count

    # Normalize to exactly 500 orders
    total = sum(customer_order_counts.values())
    if total < 500:
        extras = 500 - total
        for _ in range(extras):
            cid = random.choice(customers)["customer_id"]
            customer_order_counts[cid] += 1

    for customer in customers:
        cid = customer["customer_id"]
        joined_at = customer["joined_at"]
        n_orders = customer_order_counts[cid]

        for _ in range(n_orders):
            # Order after joining date
            days_since_join = (datetime.utcnow() - joined_at).days
            order_date = joined_at + timedelta(days=random.randint(0, max(days_since_join, 1)))

            # Pick 1-4 random items
            n_items = random.randint(1, 4)
            chosen = random.sample(PRODUCTS, min(n_items, len(PRODUCTS)))
            items = []
            total_amount = 0
            for product in chosen:
                qty = random.randint(1, 3)
                items.append({
                    "name": product["name"],
                    "quantity": qty,
                    "price": product["price"]
                })
                total_amount += product["price"] * qty

            order = {
                "order_id": f"ORD-{uuid.uuid4().hex[:8].upper()}",
                "customer_id": cid,
                "amount": total_amount,
                "items": items,
                "created_at": order_date,
            }
            orders.append(order)

    # Shuffle and trim to 500
    random.shuffle(orders)
    orders = orders[:500]

    await db.orders.insert_many(orders)
    print(f"✅ Inserted {len(orders)} orders")

    await db.orders.create_index("order_id", unique=True)
    await db.orders.create_index("customer_id")

    # Stats
    total_revenue = sum(o["amount"] for o in orders)
    print(f"\n📊 Seed Summary:")
    print(f"   Customers: 100")
    print(f"   Orders: {len(orders)}")
    print(f"   Total Revenue: ₹{total_revenue:,.2f}")
    print(f"   Avg Order: ₹{total_revenue/len(orders):,.2f}")

    client.close()
    print("\n✅ Seed complete!")


if __name__ == "__main__":
    asyncio.run(seed())
