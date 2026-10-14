#!/usr/bin/env python3
"""
Downloads the UCI Individual Household Electric Power Consumption dataset:
URL: https://archive.ics.uci.edu/static/public/235/individual+household+electric+power+consumption.zip
Or unzips/prepares into data/household_power_consumption.txt.
"""
import os
import sys
import zipfile
import urllib.request

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data"))
ZIP_URL = "https://archive.ics.uci.edu/static/public/235/individual+household+electric+power+consumption.zip"
ZIP_PATH = os.path.join(DATA_DIR, "household_power_consumption.zip")
TARGET_TXT = os.path.join(DATA_DIR, "household_power_consumption.txt")

def main():
    os.makedirs(DATA_DIR, exist_ok=True)
    if os.path.exists(TARGET_TXT):
        print(f"[✓] Dataset already exists at {TARGET_TXT} ({os.path.getsize(TARGET_TXT)/(1024*1024):.1f} MB)")
        return

    print(f"Downloading UCI dataset from {ZIP_URL}...")
    try:
        urllib.request.urlretrieve(ZIP_URL, ZIP_PATH)
        print(f"Extracting {ZIP_PATH} to {DATA_DIR}...")
        with zipfile.ZipFile(ZIP_PATH, 'r') as zip_ref:
            zip_ref.extractall(DATA_DIR)
        print(f"[✓] Successfully downloaded and extracted dataset to {TARGET_TXT}")
    except Exception as e:
        print(f"[!] Direct download failed: {e}")
        print("Manual download instructions:")
        print("1. Visit https://archive.ics.uci.edu/dataset/235/individual+household+electric+power+consumption")
        print("2. Download the zip archive and place 'household_power_consumption.txt' into the 'data/' folder.")
        print(f"3. Note: A 14-day high-resolution sample is already provided in {DATA_DIR}/household_power_consumption_sample.txt")

if __name__ == "__main__":
    main()
