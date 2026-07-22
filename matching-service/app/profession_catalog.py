"""Curated, auditable profession taxonomy for synthetic matching data."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Profession:
    """Defines job-related attributes used to generate jobs and candidate evidence."""

    title: str
    family: str
    skills: tuple[str, ...]
    responsibilities: tuple[str, ...]
    education: tuple[str, ...]
    work_modes: tuple[str, ...]


def profession(
    title: str,
    family: str,
    skills: str,
    responsibilities: str,
    education: str = "NONE,CERTIFICATE,DIPLOMA",
    work_modes: str = "ONSITE",
) -> Profession:
    """Builds a normalized profession definition from compact comma-separated source data."""

    return Profession(
        title,
        family,
        tuple(item.strip() for item in skills.split(",")),
        tuple(item.strip() for item in responsibilities.split(",")),
        tuple(item.strip() for item in education.split(",")),
        tuple(item.strip() for item in work_modes.split(",")),
    )


PROFESSIONS = (
    profession(
        "Commercial Cleaner",
        "cleaning",
        "Commercial cleaning,Chemical safety,Floor care,Infection control,Time management",
        "Clean assigned areas,Use chemicals safely,Report hazards",
    ),
    profession(
        "Hotel Housekeeper",
        "hospitality",
        "Housekeeping,Linen handling,Guest service,Infection control,Time management",
        "Prepare guest rooms,Manage linen,Report maintenance issues",
    ),
    profession(
        "Barista",
        "hospitality",
        "Coffee preparation,Food safety,Customer service,POS systems,Stock control",
        "Prepare beverages,Serve customers,Maintain food-safe workspace",
    ),
    profession(
        "Chef",
        "hospitality",
        "Food preparation,Food safety,Menu planning,Kitchen operations,Cost control",
        "Prepare meals,Supervise service,Maintain food safety",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Waiter",
        "hospitality",
        "Table service,Customer service,POS systems,Food safety,Conflict resolution",
        "Take orders,Serve guests,Resolve service issues",
    ),
    profession(
        "Farm Hand",
        "agriculture",
        "Crop care,Equipment operation,Animal handling,Workplace safety,Irrigation",
        "Maintain crops,Operate equipment,Complete farm records",
    ),
    profession(
        "Agricultural Technician",
        "agriculture",
        "Crop monitoring,Soil sampling,Irrigation,Data collection,Equipment maintenance",
        "Monitor production,Collect samples,Maintain equipment",
        "CERTIFICATE,DIPLOMA,BACHELOR",
    ),
    profession(
        "Construction Labourer",
        "construction",
        "Site safety,Manual handling,Power tools,Site preparation,Teamwork",
        "Prepare work areas,Move materials,Follow site safety plans",
    ),
    profession(
        "Carpenter",
        "construction",
        "Carpentry,Blueprint reading,Power tools,Measurement,Site safety",
        "Build structures,Interpret plans,Inspect completed work",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Electrician",
        "trades",
        "Electrical installation,Fault finding,Electrical safety,Blueprint reading,Testing",
        "Install systems,Diagnose faults,Certify safe work",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Plumber",
        "trades",
        "Plumbing,Pipe fitting,Fault finding,Blueprint reading,Workplace safety",
        "Install pipework,Repair faults,Test systems",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Welder",
        "manufacturing",
        "Welding,Fabrication,Blueprint reading,Quality inspection,Workplace safety",
        "Fabricate components,Inspect welds,Maintain equipment",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Machine Operator",
        "manufacturing",
        "Machine operation,Quality inspection,Preventive maintenance,"
        "Workplace safety,Production records",
        "Operate machinery,Inspect output,Record production",
    ),
    profession(
        "Warehouse Storeperson",
        "logistics",
        "Inventory control,Forklift operation,Picking and packing,RF scanning,Workplace safety",
        "Receive stock,Pick orders,Maintain inventory",
    ),
    profession(
        "Delivery Driver",
        "logistics",
        "Safe driving,Route planning,Customer service,Load restraint,Delivery records",
        "Plan routes,Deliver goods,Complete records",
    ),
    profession(
        "Truck Driver",
        "logistics",
        "Heavy vehicle operation,Load restraint,Fatigue management,"
        "Route planning,Vehicle inspection",
        "Transport freight,Inspect vehicle,Maintain logbook",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Retail Sales Assistant",
        "retail",
        "Customer service,POS systems,Merchandising,Stock control,Sales",
        "Assist customers,Process sales,Replenish stock",
    ),
    profession(
        "Store Manager",
        "retail",
        "Team leadership,Rostering,Inventory control,Sales analysis,Customer service",
        "Lead store team,Manage inventory,Deliver sales targets",
        "DIPLOMA,BACHELOR",
    ),
    profession(
        "Personal Care Worker",
        "care",
        "Personal care,Manual handling,Infection control,Client records,Communication",
        "Support daily living,Maintain records,Follow care plans",
        "CERTIFICATE,DIPLOMA",
    ),
    profession(
        "Registered Nurse",
        "healthcare",
        "Clinical care,Medication administration,Patient assessment,"
        "Clinical documentation,Infection control",
        "Assess patients,Deliver care,Maintain clinical records",
        "BACHELOR,MASTER",
    ),
    profession(
        "Childcare Educator",
        "education",
        "Early childhood education,Child safety,Learning plans,Family communication,Documentation",
        "Plan learning,Supervise children,Document development",
        "CERTIFICATE,DIPLOMA,BACHELOR",
    ),
    profession(
        "Primary School Teacher",
        "education",
        "Lesson planning,Classroom management,Student assessment,Curriculum,Family communication",
        "Teach curriculum,Assess learning,Support students",
        "BACHELOR,MASTER",
    ),
    profession(
        "Receptionist",
        "administration",
        "Customer service,Calendar management,Phone systems,Data entry,Office administration",
        "Receive visitors,Manage appointments,Maintain records",
        "NONE,CERTIFICATE,DIPLOMA",
        "ONSITE,HYBRID",
    ),
    profession(
        "Bookkeeper",
        "finance",
        "Bookkeeping,Accounts payable,Accounts receivable,Reconciliation,Accounting software",
        "Process transactions,Reconcile accounts,Prepare reports",
        "CERTIFICATE,DIPLOMA,BACHELOR",
        "ONSITE,HYBRID,REMOTE",
    ),
    profession(
        "Data Analyst",
        "data",
        "SQL,Data visualisation,Statistics,Python,Stakeholder communication",
        "Analyse data,Build reports,Explain insights",
        "BACHELOR,MASTER",
        "ONSITE,HYBRID,REMOTE",
    ),
    profession(
        "Software Engineer",
        "technology",
        "Software development,Testing,Git,System design,TypeScript",
        "Build software,Review code,Operate services",
        "DIPLOMA,BACHELOR,MASTER",
        "ONSITE,HYBRID,REMOTE",
    ),
    profession(
        "Cyber Security Analyst",
        "technology",
        "Security monitoring,Incident response,Network security,Risk assessment,Security reporting",
        "Monitor threats,Investigate incidents,Improve controls",
        "DIPLOMA,BACHELOR,MASTER",
        "ONSITE,HYBRID,REMOTE",
    ),
    profession(
        "Graphic Designer",
        "creative",
        "Graphic design,Adobe Creative Suite,Typography,Brand design,Stakeholder communication",
        "Create designs,Apply brand standards,Prepare production files",
        "DIPLOMA,BACHELOR",
        "ONSITE,HYBRID,REMOTE",
    ),
    profession(
        "Landscape Gardener",
        "horticulture",
        "Plant care,Landscaping,Power tools,Irrigation,Workplace safety",
        "Maintain gardens,Install landscapes,Operate tools",
    ),
    profession(
        "Automotive Mechanic",
        "automotive",
        "Vehicle diagnostics,Mechanical repair,Preventive maintenance,"
        "Workshop safety,Customer communication",
        "Diagnose faults,Repair vehicles,Document service",
        "CERTIFICATE,DIPLOMA",
    ),
)
