#!/usr/bin/env python3
"""Simple checks for new ride history endpoints"""
import requests

BASE_URL = "http://10.0.2.2:5000/api"


def test_receipt_endpoint():
    url = f"{BASE_URL}/ride-history/test/receipt"
    try:
        r = requests.get(url)
        print("Receipt endpoint status:", r.status_code)
    except Exception as e:
        print("Receipt endpoint error:", e)


def test_statistics_endpoint():
    url = f"{BASE_URL}/ride-history/history/statistics"
    try:
        r = requests.get(url)
        print("Statistics endpoint status:", r.status_code)
    except Exception as e:
        print("Statistics endpoint error:", e)


if __name__ == "__main__":
    test_receipt_endpoint()
    test_statistics_endpoint()
