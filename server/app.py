#!/usr/bin/env python3

# library imports
from flask import request, abort, make_response, session
from flask_restful import Resource

from werkzeug.exceptions import NotFound, Unauthorized
from datetime import datetime, timedelta, time, date 
from sqlalchemy import func

# local imports
# sets absolute path for deployment
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from config import app, db, api
from helpers import get_next_monday, get_previous_monday
from models import db, User, Project, Group, MasterTask, MasterTaskDependency, TaskUser, Unit, UnitTask, StatusUpdate


# from app_helpers import find_task_model_by_id
from rest.auth import UserSignup, UserLogin, UserLogout, UserAuthorize, UserProfile
from rest.groups import Groups, GroupByID
from rest.updates import StatusUpdates, StatusUpdateByID
from rest.master_tasks import MasterTasks, MasterTaskByID, Dependencies, DependencyByID, get_dependencies_ancestors, get_dependencies_descendents, get_dependencies_available
from rest.units import Units, UnitByID
from rest.unit_tasks import UnitTasks, UnitTaskByID, get_project_pending_update
from rest.projects import get_projects, get_project_details, get_projects_minimal, get_project_report


# the following adds route-specific authorization
@app.before_request
def authenticate_user():
    open_access_list = [None,"static","usersignup", "userlogin", "userlogout", "userauthorize","dev"]
    
    # if the user is in session OR the request endpoint is open-access, the request will be processed as usual
    if request.endpoint not in open_access_list and not session.get("user_id"):
        raise Unauthorized    

# see rest.project for /api/project...
# see rest.unit_tasks for /api/unittasks/pending_update/project/<id>
# see rest.master_tasks for /api/mastertasks...

api.add_resource(UserSignup, '/api/signup')
api.add_resource(UserLogin, '/api/login')
api.add_resource(UserLogout, '/api/logout')
api.add_resource(UserAuthorize, '/api/authorize')
api.add_resource(UserProfile, '/api/profile')

api.add_resource(Groups, '/api/groups')
api.add_resource(GroupByID, '/api/groups/<int:id>')

api.add_resource(StatusUpdates, '/api/updates')
api.add_resource(StatusUpdateByID, '/api/updates/<int:id>')

api.add_resource(MasterTasks, '/api/mastertasks')
api.add_resource(MasterTaskByID, '/api/mastertasks/<int:id>')

api.add_resource(Dependencies, '/api/dependencies')
api.add_resource(DependencyByID, '/api/dependencies/<int:id>')

api.add_resource(Units, '/api/units')
api.add_resource(UnitByID, '/api/units/<int:id>')

api.add_resource(UnitTasks, '/api/unittasks')
api.add_resource(UnitTaskByID, '/api/unittasks/<int:id>')


class Dev(Resource):
    def get(self):

        data = {
            "company_id": 1,
            "is_export": False,
            "port_of_lading": "SHANGHAI, CHINA",
            "port_of_lading_un_code": "CNSHA",
            "port_of_destination": "NEW YORK, NY, USA",
            "port_of_destination_un_code": "USNYC",
            "duty": "345.00",
            "port_of_unlading": None,
            "port_of_unlading_un_code": None,
            "eta": "2023-02-08T00:00:00.000000Z",
            "port_of_unlading_eta": "2023-02-08T00:00:00.000000Z",
            "etd": "2022-12-19T00:00:00.000000Z",
            "carrier": None,
            "status": "Vessel Arrived",
            "vessel_and_voyage_number": None,
            "container_info": [
                {
                "size": "20ft",
                "type": "dv",
                "number": "ADTF4056034",
                "seal_number": "ADTF4056034",
                "last_free_day": "2023-02-02",
                "cfs_lfd": None,
                "rail_lfd": None,
                "estimated_delivery_date": "2023-02-16",
                "discharged": "2024-02-13",
                "picked_up": "2024-02-13",
                "empty_picked_up": "2023-08-10",
                "released_from_cfs": "2024-11-25",
                "picked_up_from_cfs": None,
                "full_returned": "2024-02-13",
                "empty_returned_destination": None,
                "delivered_on": "2024-02-20T00:00:00.000000Z",
                "weight_kg": "572.00",
                "weight_lbs": 1261.26,
                "po_numbers": "JD100015-0, JD10005-1, JD10024-0",
                "per_diem_lfd": None,
                "delivery_schedule_per_cust": None,
                "ready_for_empty_return_at": "2024-02-22",
                "pos": [
                    {
                    "id": 13,
                    "po_number": "JD100015-0",
                    "description": "Hats and Gloves",
                    "terms": "FOB",
                    "creation_date": "2023-02-17",
                    "ready_date": "2023-07-20T00:00:00.000000Z",
                    "status": "PENDING",
                    "deposit": None,
                    "custom_note": None,
                    "booking_status": "Partially Assigned",
                    "items": [
                        {
                        "id": 16,
                        "sku": "JD10001",
                        "description": "Wool Slipper",
                        "cartons": 20,
                        "price_per_piece": 200,
                        "landed_cost": 19.3,
                        "shipping_cost_per_line": 8483.96,
                        "shipping_cost_per_piece": 2.3,
                        "pieces_per_carton": 500,
                        "size_per_carton": "0.010",
                        "custom_note": "Hello Ramon",
                        "status": "NEW",
                        "hts": None,
                        "duty_rate_percent": "9.00"
                        },
                        {
                        "id": 17,
                        "sku": "JD10002",
                        "description": "Leather Jackets",
                        "cartons": 15,
                        "price_per_piece": 5,
                        "landed_cost": 29.3,
                        "shipping_cost_per_line": 383.96,
                        "shipping_cost_per_piece": 2.3,
                        "pieces_per_carton": 600,
                        "size_per_carton": "0.005",
                        "custom_note": "Hey Hey",
                        "status": "NEW",
                        "hts": None,
                        "duty_rate_percent": "15.00"
                        }
                    ]
                    },
                    {
                    "id": 146,
                    "po_number": "JD10024-0",
                    "description": "Something",
                    "terms": "EXW",
                    "creation_date": "2024-05-22",
                    "ready_date": "2024-05-16T00:00:00.000000Z",
                    "status": "NEW",
                    "deposit": 15.2,
                    "custom_note": None,
                    "booking_status": "Partially Assigned",
                    "items": [
                        {
                        "id": 423,
                        "sku": "456",
                        "description": "Not Provided",
                        "cartons": 22,
                        "price_per_piece": 2,
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 2,
                        "size_per_carton": "0.000",
                        "custom_note": "Rush",
                        "status": "NEW",
                        "hts": None,
                        "duty_rate_percent": None
                        },
                        {
                        "id": 424,
                        "sku": "789",
                        "description": "Not Provided",
                        "cartons": 88,
                        "price_per_piece": 1,
                        "landed_cost": 21.12,
                        "shipping_cost_per_line": 2445.29,
                        "shipping_cost_per_piece": 15.32,
                        "pieces_per_carton": 2,
                        "size_per_carton": "0.000",
                        "custom_note": "Rush",
                        "status": "NEW",
                        "hts": None,
                        "duty_rate_percent": None
                        }
                    ]
                    }
                ]
                },
                {
                "size": "20ft",
                "type": "dv",
                "number": None,
                "last_free_day": "2023-02-02",
                "cfs_lfd": None,
                "rail_lfd": None,
                "estimated_delivery_date": "2023-02-15",
                "discharged": None,
                "picked_up": None,
                "empty_picked_up": "2023-08-10",
                "released_from_cfs": "2024-11-25",
                "picked_up_from_cfs": None,
                "full_returned": None,
                "empty_returned_destination": None,
                "delivered_on": None,
                "weight_kg": "0.00",
                "weight_lbs": 0,
                "po_numbers": None,
                "per_diem_lfd": None,
                "delivery_schedule_per_cust": None,
                "ready_for_empty_return_at": None
                }
            ],
            "request_date": "2022-12-13T00:00:00.000000Z",
            "containers": {
                "dv": {
                "20ft": 2
                }
            },
            "suppliers": [
                {
                "name": "Xuangzhou Xiao",
                "hbl_number": None,
                "po_numbers": ", JD100015-0, JD10005-1",
                "cartons": 12,
                "telex_release_date": None,
                "cargo_dimensions": [],
                "inco_terms": "fca",
                "po_info": [
                    {
                    "id": 13,
                    "po_number": "JD100015-0",
                    "description": "Hats and Gloves",
                    "terms": "FOB",
                    "creation_date": "2023-02-17",
                    "ready_date": "2023-07-20",
                    "status": "PENDING",
                    "deposit": 500,
                    "custom_note": None,
                    "booking_status": "Fully Assigned",
                    "items": [
                        {
                        "id": 16,
                        "sku": "JD10001",
                        "description": "Wool Slipper",
                        "cartons": 50,
                        "price_per_piece": "200.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 500,
                        "size_per_carton": 2,
                        "custom_note": None,
                        "status": "NEW",
                        "hts": "9601.52.48.13",
                        "duty_rate_percent": "2.00"
                        },
                        {
                        "id": 17,
                        "sku": "JD10002",
                        "description": "Leather Jackets",
                        "cartons": 45,
                        "price_per_piece": "5.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 600,
                        "size_per_carton": 3,
                        "custom_note": None,
                        "status": "NEW",
                        "hts": "9841.52.42.31",
                        "duty_rate_percent": "1.50"
                        },
                        {
                        "id": 18,
                        "sku": "JD10004",
                        "description": "Silver fork",
                        "cartons": 70,
                        "price_per_piece": "8.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 300,
                        "size_per_carton": 1,
                        "custom_note": None,
                        "status": "NEW",
                        "hts": "7510.58.95.65",
                        "duty_rate_percent": "2.15"
                        },
                        {
                        "id": 91,
                        "sku": "JD10002",
                        "description": "Leather Jackets",
                        "cartons": 5,
                        "price_per_piece": "5.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 600,
                        "size_per_carton": 3,
                        "custom_note": None,
                        "status": "NEW",
                        "hts": "9841.52.42.31",
                        "duty_rate_percent": "1.50"
                        },
                        {
                        "id": 92,
                        "sku": "JD10002",
                        "description": "Leather Jackets",
                        "cartons": 10,
                        "price_per_piece": "5.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 600,
                        "size_per_carton": 3,
                        "custom_note": None,
                        "status": "NEW",
                        "hts": "9841.52.42.31",
                        "duty_rate_percent": "1.50"
                        }
                    ]
                    },
                    {
                    "id": 27,
                    "po_number": "JD10005-1",
                    "description": "Konnichiwa Motors Parts",
                    "terms": "FOB",
                    "creation_date": "2023-02-01",
                    "ready_date": "2023-02-08",
                    "status": "APPROVED",
                    "deposit": None,
                    "custom_note": None,
                    "booking_status": "Partially Assigned",
                    "items": [
                        {
                        "id": 19,
                        "sku": "JD10001",
                        "description": "Wool Slipper",
                        "cartons": 15,
                        "price_per_piece": "15.00",
                        "landed_cost": 14.23,
                        "shipping_cost_per_line": 2233.33,
                        "shipping_cost_per_piece": 5.32,
                        "pieces_per_carton": 150,
                        "size_per_carton": 3,
                        "custom_note": None,
                        "status": "APPROVED",
                        "hts": "601.52.48.13",
                        "duty_rate_percent": "2.00"
                        }
                    ]
                    }
                ]
                }
            ],
            "logistics": True,
            "agent": "China",
            "so_number": None,
            "total_cbm": 10,
            "alliance_number": "3653740",
            "entry_number": "DP4-3653740-2",
            "master_bill_of_lading": "IZ1220000987",
            "net_entered_value": None,
            "duty": None,
            "billed_to_date": None,
            "container_amount": 2,
            "free_per_diem_days": None,
            "per_diem_days_in_business_days": None,
            "customs_released": None,
            "is_customs_released": True,
            "freight_released": None,
            "is_freight_released": True,
            "fda_released": None,
            "days_cleared_prior_eta": None,
            "departed": True,
            "arrived": True,
            "arrival_notice_sent": False,
            "pre_alert_sent": False,
            "mode": "FCL",
            "updated": False,
            "cy_cutoff": "2022-12-19T00:00:00.000000Z",
            "cargo_ready_date": "2022-12-12T00:00:00.000000Z",
            "terminal": None,
            "booking_number": None,
            "total_cartons": 12,
            "dispatch_status": "",
            "unit_freight_charges": [
                {
                "type": "dv",
                "unit": "20ft",
                "total": "$510"
                }
            ],
            "total_freight_charges": 1020,
            "all_charges": [
                {
                "serviceId": 140,
                "type": "dv",
                "unit": "20ft",
                "total": "$510"
                },
                {
                "serviceId": 348,
                "type": None,
                "unit": "shipment",
                "total": "$0"
                },
                {
                "serviceId": 101,
                "type": None,
                "unit": "shipment",
                "total": "$70.00"
                }
            ],
            "trucking_carrier": "",
            "air_lfd": None,
            "containers_on_sent_dos": 3,
            "do_automation": True,
            "delivery_location": {
                "name": "Ichien Warehouse",
                "address": "90 Broad St, New York, NY 10004, USA ",
                "city": "NY",
                "state": "NY",
                "country": "US",
                "zip_code": "10004",
                "phone": "",
                "un_locode": "",
                "warehouse_code": ""
            },
            "pickup_location": "CENTRAL TRANSPORT INTERNATIONAL INC",
            "delivery_order_sent": None,
            "all_containers_sent_in_delivery_order": False,
            "comments": None,
            "shipment_id": 3501485
            }
        
        return make_response(data, 200)
        #return make_response({"success": f"Something here"}, 200)
        #return make_response(model.to_dict(only=self.__class__.response_fields,rules=('latest_update',)), 200)
    
api.add_resource(Dev, '/api/dev')



if __name__ == '__main__':
    app.run(port=5555, debug=True)