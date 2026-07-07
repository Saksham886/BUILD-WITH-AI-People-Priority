"""Sample grievances for the demo — several intentionally duplicate clusters."""
from .models import GrievanceIn

SAMPLE_GRIEVANCES: list[GrievanceIn] = [
    # --- Cluster: broken water pipeline near Main Market (High urgency, big count) ---
    GrievanceIn(summary="The water pipeline near Main Market has burst and water is flooding the road.",
                category="Water Supply", urgency="High", location="Main Market"),
    GrievanceIn(summary="Broken water pipe close to Main Market, no drinking water since morning.",
                category="Water Supply", urgency="High", location="Main Market"),
    GrievanceIn(summary="Main Market water line is leaking badly, streets are waterlogged.",
                category="Water Supply", urgency="High", location="Main Market"),
    GrievanceIn(summary="Paani ki pipeline Main Market ke paas phat gayi hai, bahut pareshani ho rahi hai.",
                category="Water Supply", urgency="Medium", location="Main Market", language="Hinglish"),
    GrievanceIn(summary="No water supply in our area because the main pipeline near the market is damaged.",
                category="Water Supply", urgency="High", location="Main Market"),

    # --- Cluster: street lights not working on Gandhi Road (Medium) ---
    GrievanceIn(summary="Street lights on Gandhi Road have not been working for a week, it is very dark at night.",
                category="Electricity", urgency="Medium", location="Gandhi Road"),
    GrievanceIn(summary="The lights along Gandhi Road are all switched off, unsafe to walk after dark.",
                category="Electricity", urgency="Medium", location="Gandhi Road"),
    GrievanceIn(summary="Gandhi Road street lamps are broken, please repair the lighting.",
                category="Electricity", urgency="Low", location="Gandhi Road"),

    # --- Cluster: garbage not collected in Sector 5 (Medium) ---
    GrievanceIn(summary="Garbage has not been collected in Sector 5 for several days, it is stinking.",
                category="Sanitation", urgency="Medium", location="Sector 5"),
    GrievanceIn(summary="Uncollected trash piling up in Sector 5, health hazard for residents.",
                category="Sanitation", urgency="High", location="Sector 5"),

    # --- Cluster: potholes on the highway (Low) ---
    GrievanceIn(summary="There are large potholes on the NH-8 highway causing traffic and accidents.",
                category="Roads", urgency="Low", location="NH-8 Highway"),
    GrievanceIn(summary="Dangerous potholes on National Highway 8, vehicles getting damaged.",
                category="Roads", urgency="Medium", location="NH-8 Highway"),

    # --- Singletons: unique complaints (should each be their own incident) ---
    GrievanceIn(summary="Stray dogs are becoming aggressive near the government school.",
                category="Public Safety", urgency="Low", location="Govt School"),
    GrievanceIn(summary="The community health center is out of stock of basic medicines.",
                category="Health", urgency="High", location="PHC Block B"),
]
