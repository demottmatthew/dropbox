import json
import MySQLdb
from pprint import pprint
try:
    db = MySQLdb.connect(host="localhost", user="root", db="brand_central")
    db.set_character_set('utf8')
    cursor = db.cursor()
    cursor.execute('SET NAMES utf8;')
    cursor.execute('SET CHARACTER SET utf8;')
    cursor.execute('SET character_set_connection=utf8;')
except MySQLdb.Error:
    print("Error in Connection")
for num in range(2,10):
    count = 0
    with open('data'+str(num)+'.json') as data_file:
        dataList = json.load(data_file)
    for product in dataList:
        count += 1
        # Remove some special characters and whitespace
        name = product["NAME"].replace('\'', '').replace('(','').replace(')', '').strip()
        desc = product["DESCRIPTION"].replace('\'', '').replace('”','"').replace('\n','').replace('\&amp', '\&').strip()
        desc = " ".join(desc.split())
        imageUrl = product["IMAGE_URL"].replace('\'', '').strip()
        productUrl = product["URL"].replace('\'', '').strip()
        print("File Number: " + str(num) + "  Product Number: " + str(count) + "Product Name: " + name)
        query = """INSERT INTO PRODUCT (PROD_NAME, PROD_DESC, PROD_PICT_URL, PROD_URL) VALUES ('%s','%s','%s','%s')""" % (name, desc, imageUrl, productUrl)
        cursor.execute(query)
        # Get ID of product just sent to table
        productID = cursor.lastrowid

        # Use productID to assign tags and strengths to the last product
        for i in range(len(product["TAGS"])):
            if product["TAG_STRENGTH"][i] > 0:
                tagName = product["TAGS"][i].replace('\'','').strip()
                query = """SELECT TAG_ID FROM TAG WHERE TAG_DESC LIKE ('%s')""" % tagName
                cursor.execute(query)
                # print(query)
                # If tag already exists in DB
                if cursor.rowcount > 0:
                    tagID = cursor.fetchone()[0]

                # Else add it to the DB and store the ID
                else:
                    query = """INSERT INTO TAG (TAG_DESC) VALUE ('%s')""" % tagName
                    cursor.execute(query)
                    # print(query)
                    tagID = cursor.lastrowid

                query = """SELECT * FROM PROD_TAG_ASSIGN WHERE PRODUCT_ID = '%d' AND TAG_ID = '%d'""" % (productID, tagID)
                cursor.execute(query)
                # If tag exists multiple times for the same product, only keep top correlation
                if not (cursor.rowcount) > 0:
                    # Insert the product/tag combination into the DB
                    query = """INSERT INTO PROD_TAG_ASSIGN (PRODUCT_ID, TAG_ID, PROD_TAG_STR) VALUES ('%d','%d','%f')""" % (productID, tagID, product["TAG_STRENGTH"][i])
                cursor.execute(query)
                # print(query)


    # Commit all data to the database
    db.commit()