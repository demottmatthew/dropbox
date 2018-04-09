-- MySQL dump 10.13  Distrib 5.5.59, for Linux (x86_64)
--
-- Host: sysadmin.c51ezfqpiipt.us-east-2.rds.amazonaws.com    Database: DROPBOX
-- ------------------------------------------------------
-- Server version	5.5.5-10.1.26-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `USER`
--

DROP TABLE IF EXISTS `USER`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `USER` (
  `USER_ID` int(8) NOT NULL AUTO_INCREMENT,
  `USERNAME` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `USER_LNAME` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `USER_FNAME` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `USER_EMAIL` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `USER_PASS_HASH` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `VER_TOKEN` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `VER_CODE` int(6) DEFAULT NULL,
  `VERIFIED` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`USER_ID`),
  UNIQUE KEY `USER_ID` (`USER_ID`),
  UNIQUE KEY `USER_EMAIL` (`USER_EMAIL`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `USER`
--

LOCK TABLES `USER` WRITE;
/*!40000 ALTER TABLE `USER` DISABLE KEYS */;
INSERT INTO `USER` VALUES (1,'Deanout','DeHart','Dean','dddehart@oakland.edu','$2a$10$D57j4OvJeS6mwmc9YuCbheL9l7aBZooZ/I8PUEz8qbtm6p7qKFhVm','ca91af38b8979dc52a98e6734dfbd27f',404053,1),(2,'mldemott','demott','matthew','mldemott@oakland.edu','$2a$10$q214IhK.wq/reV8Lug5v0e5KDi9KEds8u5E9EURIQSdhggPVMQJw.','8df385079ee755994948910fedb38c7c',637557,1),(3,'testcase','Case','Test','dean@deanout.com','$2a$10$Q9fTTgjGNhG4ufH4eGjBeeUE8fpZ5YWvv.kUtTtzEvkNSlVjR022S','1ddc4ba2fe243335c00a0d8b89e06add',511106,1);
/*!40000 ALTER TABLE `USER` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2018-04-09 22:08:27
