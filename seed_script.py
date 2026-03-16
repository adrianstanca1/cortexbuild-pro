#!/usr/bin/env python3
"""
Seed script for CortexBuild Pro PostgreSQL database
Populates with realistic construction management data
"""

import psycopg2
from datetime import datetime, timedelta
import random
import uuid

# Database connection
DB_HOST = "cortexbuild-db"
DB_USER = "cortexbuild"
DB_PASSWORD = "hBc6YAgMxBdksQqqPypcSfWkZKaa827"
DB_NAME = "cortexbuild"

def get_connection():
    return psycopg2.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME
    )

def seed_organizations(conn):
    """Create organizations"""
    orgs = [
        ("org-1", "BuildCorp Solutions", "ENTERPRISE", True),
        ("org-2", "Titan Construction Ltd", "PROFESSIONAL", True),
        ("org-3", "Metro Builders Inc", "STARTER", True),
    ]
    
    with conn.cursor() as cur:
        for org_id, name, tier, active in orgs:
            cur.execute("""
                INSERT INTO "Organization" (id, name, "subscriptionTier", "isActive", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (org_id, name, tier, active, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(orgs)} organizations")

def seed_users(conn):
    """Create users"""
    users = [
        ("user-1", "admin@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Super Admin", "SUPERADMIN", "org-1", True),
        ("user-2", "pm@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "John Anderson", "ADMIN", "org-1", True),
        ("user-3", "field@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Sarah Mitchell", "PROJECT_MANAGER", "org-1", True),
        ("user-4", "worker1@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Mike Johnson", "FIELD_WORKER", "org-1", True),
        ("user-5", "worker2@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Emily Davis", "FIELD_WORKER", "org-1", True),
        ("user-6", "safety@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Robert Brown", "SAFETY_OFFICER", "org-1", True),
        ("user-7", "finance@buildcorp.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Lisa Wilson", "FINANCE_MANAGER", "org-1", True),
        ("user-8", "pm@titan.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "David Chen", "ADMIN", "org-2", True),
        ("user-9", "worker@titan.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "James Taylor", "FIELD_WORKER", "org-2", True),
        ("user-10", "pm@metro.com", "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqKx8pB4W", "Anna Martinez", "PROJECT_MANAGER", "org-3", True),
    ]
    
    with conn.cursor() as cur:
        for user_id, email, password, name, role, org_id, active in users:
            cur.execute("""
                INSERT INTO "User" (id, email, password, name, role, "organizationId", "isActive", "emailVerified", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (user_id, email, password, name, role, org_id, active, True, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(users)} users")

def seed_projects(conn):
    """Create projects"""
    projects = [
        ("proj-1", "org-1", "City Centre Plaza", "CCP-2025", "PLANNING", "Downtown Metro, 123 Main St", 50000000),
        ("proj-2", "org-1", "Harbor Bridge Renovation", "HBR-2024", "IN_PROGRESS", "Harbor District, Bridge Road", 25000000),
        ("proj-3", "org-1", "Riverside Apartments", "RA-2025", "IN_PROGRESS", "Riverside Ave, 456 River Rd", 35000000),
        ("proj-4", "org-1", "Tech Park Phase 2", "TP2-2024", "COMPLETED", "Innovation District, 789 Tech Blvd", 18000000),
        ("proj-5", "org-2", "Hospital Wing Extension", "HWE-2025", "PLANNING", "General Hospital, 321 Health St", 15000000),
        ("proj-6", "org-2", "Shopping Mall Revamp", "SMR-2024", "IN_PROGRESS", "Central Mall, 100 Shopping Way", 8000000),
        ("proj-7", "org-3", "School Building Project", "SBP-2025", "PLANNING", "Oak Street School, 50 Oak Ave", 6000000),
    ]
    
    with conn.cursor() as cur:
        for proj_id, org_id, name, code, status, location, budget in projects:
            cur.execute("""
                INSERT INTO "Project" (id, "organizationId", name, code, status, location, "totalBudget", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (proj_id, org_id, name, code, status, location, budget, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(projects)} projects")

def seed_tasks(conn):
    """Create tasks"""
    tasks = [
        ("task-1", "proj-1", "Foundation excavation", "IN_PROGRESS", "2025-04-01", "2025-05-15"),
        ("task-2", "proj-1", "Structural steel ordering", "PENDING", "2025-05-01", "2025-05-15"),
        ("task-3", "proj-1", "Permit application submission", "COMPLETED", "2025-02-01", "2025-03-01"),
        ("task-4", "proj-2", "Bridge deck replacement", "IN_PROGRESS", "2024-10-01", "2025-06-01"),
        ("task-5", "proj-2", "Cable replacement inspection", "PENDING", "2025-05-01", "2025-05-15"),
        ("task-6", "proj-3", "Site preparation", "COMPLETED", "2024-11-01", "2024-12-15"),
        ("task-7", "proj-3", "Foundation pouring", "IN_PROGRESS", "2025-01-15", "2025-03-01"),
        ("task-8", "proj-4", "Final electrical inspection", "COMPLETED", "2024-08-01", "2024-09-01"),
    ]
    
    with conn.cursor() as cur:
        for task_id, proj_id, title, status, start, end in tasks:
            cur.execute("""
                INSERT INTO "Task" (id, "projectId", title, status, "startDate", "dueDate", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (task_id, proj_id, title, status, start, end, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(tasks)} tasks")

def seed_equipment(conn):
    """Create equipment"""
    equipment = [
        ("eq-1", "proj-1", "Excavator CAT 320", "EXCAVATOR", "ACTIVE"),
        ("eq-2", "proj-1", "Crane Liebherr LTM 1100", "CRANE", "ACTIVE"),
        ("eq-3", "proj-2", "Concrete Pump Putzmeister", "CONCRETE_PUMP", "ACTIVE"),
        ("eq-4", "proj-2", "Bridges Inspection Drone", "DRONE", "ACTIVE"),
        ("eq-5", "proj-3", "Backhoe John Deere 310", "BACKHOE", "MAINTENANCE"),
        ("eq-6", "proj-4", "Scissor Lift JLG 1930ES", "LIFT", "ACTIVE"),
    ]
    
    with conn.cursor() as cur:
        for eq_id, proj_id, name, type, status in equipment:
            cur.execute("""
                INSERT INTO "Equipment" (id, "projectId", name, type, status, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (eq_id, proj_id, name, type, status, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(equipment)} equipment items")

def seed_safety(conn):
    """Create safety incidents and inspections"""
    incidents = [
        ("inc-1", "proj-1", "Minor", "First aid - cut on hand", "2025-03-10"),
        ("inc-2", "proj-2", "Moderate", "Worker tripped - sprained ankle", "2025-03-08"),
        ("inc-3", "proj-3", "Minor", "Dust in eye - flushed", "2025-03-05"),
    ]
    
    with conn.cursor() as cur:
        for inc_id, proj_id, severity, description, date in incidents:
            cur.execute("""
                INSERT INTO "SafetyIncident" (id, "projectId", severity, description, "incidentDate", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (inc_id, proj_id, severity, description, date, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(incidents)} safety incidents")

def seed_rfi(conn):
    """Create RFI entries"""
    rfis = [
        ("rfi-1", "proj-1", "Structural connection detail", "OPEN", "user-3", "2025-03-01"),
        ("rfi-2", "proj-2", "Bridge bearing specification", "ANSWERED", "user-3", "2025-02-15"),
        ("rfi-3", "proj-3", "Foundation rebar spacing", "CLOSED", "user-3", "2025-01-20"),
    ]
    
    with conn.cursor() as cur:
        for rfi_id, proj_id, subject, status, created_by, date in rfis:
            cur.execute("""
                INSERT INTO "RFI" (id, "projectId", subject, status, "createdById", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (rfi_id, proj_id, subject, status, created_by, date, datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(rfis)} RFI entries")

def seed_materials(conn):
    """Create materials"""
    materials = [
        ("mat-1", "proj-1", "Concrete C35", "500", "m3"),
        ("mat-2", "proj-1", "Rebar 16mm", "25000", "kg"),
        ("mat-3", "proj-2", "Structural Steel Beams", "150", "tons"),
        ("mat-4", "proj-3", "Aggregate Type 2", "2000", "tons"),
    ]
    
    with conn.cursor() as cur:
        for mat_id, proj_id, name, quantity, unit in materials:
            cur.execute("""
                INSERT INTO "Material" (id, "projectId", name, quantity, unit, "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (mat_id, proj_id, name, quantity, unit, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(materials)} material entries")

def seed_milestones(conn):
    """Create milestones"""
    milestones = [
        ("ms-1", "proj-1", "Site Clearing Complete", "COMPLETED", "2025-02-28"),
        ("ms-2", "proj-1", "Foundation Complete", "IN_PROGRESS", "2025-05-15"),
        ("ms-3", "proj-2", "Deck Removal Complete", "COMPLETED", "2025-02-01"),
        ("ms-4", "proj-2", "New Deck Installed", "IN_PROGRESS", "2025-06-01"),
    ]
    
    with conn.cursor() as cur:
        for ms_id, proj_id, title, status, target in milestones:
            cur.execute("""
                INSERT INTO "Milestone" (id, "projectId", title, status, "targetDate", "createdAt", "updatedAt")
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO NOTHING
            """, (ms_id, proj_id, title, status, target, datetime.utcnow(), datetime.utcnow()))
    conn.commit()
    print(f"✓ Created {len(milestones)} milestones")

def verify_data(conn):
    """Verify data was inserted"""
    tables = ["Organization", "User", "Project", "Task", "Equipment", "SafetyIncident", "RFI", "Material", "Milestone"]
    print("\n📊 Verification:")
    with conn.cursor() as cur:
        for table in tables:
            cur.execute(f'SELECT COUNT(*) FROM "{table}"')
            count = cur.fetchone()[0]
            print(f"  {table}: {count} rows")

def main():
    print("🌱 Seeding CortexBuild Pro database...")
    conn = get_connection()
    
    try:
        seed_organizations(conn)
        seed_users(conn)
        seed_projects(conn)
        seed_tasks(conn)
        seed_equipment(conn)
        seed_safety(conn)
        seed_rfi(conn)
        seed_materials(conn)
        seed_milestones(conn)
        
        verify_data(conn)
        print("\n✅ Database seeding complete!")
    except Exception as e:
        print(f"❌ Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    main()