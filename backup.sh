#!/bin/bash

timestamp=$(date +%s)

filenameUSR=backup_users_$timestamp.sql
filenameAPPT=backup_appointments_$timestamp.sql

mysqldump -u deanout -p^SjaP#rrW7Rg -h sysadmin.c51ezfqpiipt.us-east-2.rds.amazonaws.com DROPBOX USER > /home/ec2-user/dropbox/${filenameUSR}
mysqldump -u deanout -p^SjaP#rrW7Rg -h sysadmin.c51ezfqpiipt.us-east-2.rds.amazonaws.com DROPBOX APPOINTMENTS > /home/ec2-user/dropbox/${filenameAPPT}
