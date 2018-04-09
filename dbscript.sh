#!/bin/bash
sh /home/ec2-user/dropbox/backup.sh
mysql -u deanout -p^SjaP#rrW7Rg -h sysadmin.c51ezfqpiipt.us-east-2.rds.amazonaws.com <<EOF
use DROPBOX;
UPDATE APPOINTMENTS SET VALID_BIT = '0' WHERE APP_DATE < CURDATE();
EOF
