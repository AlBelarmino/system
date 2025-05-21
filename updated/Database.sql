-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: payslip
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dtr_days`
--

DROP TABLE IF EXISTS `dtr_days`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtr_days` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dtr_id` int(11) DEFAULT NULL,
  `day` int(11) DEFAULT NULL,
  `am_arrival` varchar(10) DEFAULT NULL,
  `am_departure` varchar(10) DEFAULT NULL,
  `pm_arrival` varchar(10) DEFAULT NULL,
  `pm_departure` varchar(10) DEFAULT NULL,
  `undertime_hours` int(11) DEFAULT NULL,
  `undertime_minutes` int(11) DEFAULT NULL,
  `is_compliant` tinyint(1) DEFAULT 1,
  `details` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `dtr_id` (`dtr_id`),
  CONSTRAINT `dtr_days_ibfk_1` FOREIGN KEY (`dtr_id`) REFERENCES `dtrs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1811 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dtr_days`
--

LOCK TABLES `dtr_days` WRITE;
/*!40000 ALTER TABLE `dtr_days` DISABLE KEYS */;
INSERT INTO `dtr_days` VALUES (1766,115,1,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1767,115,2,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1768,115,3,'7:00','12:00','13:00','17:00',0,0,1,NULL),(1769,115,4,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1770,115,5,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1771,115,6,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1772,115,7,'8:55','12:00','13:00','17:00',0,0,1,NULL),(1773,115,8,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1774,115,9,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1775,115,10,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1776,115,11,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1777,115,12,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1778,115,13,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1779,115,14,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1780,115,15,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1781,116,1,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1782,116,2,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1783,116,3,'7:00','12:00','13:00','17:00',0,0,1,NULL),(1784,116,4,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1785,116,5,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1786,116,6,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1787,116,7,'7:55','12:00','13:00','17:00',0,0,1,NULL),(1788,116,8,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1789,116,9,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1790,116,10,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1791,116,11,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1792,116,12,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1793,116,13,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1794,116,14,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1795,116,15,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1796,116,16,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1797,116,17,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1798,116,18,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1799,116,19,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1800,116,20,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1801,116,21,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1802,116,22,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1803,116,23,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1804,116,24,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1805,116,25,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1806,116,26,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1807,116,27,'10:00','12:00','13:00','17:00',0,0,1,NULL),(1808,116,28,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1809,116,29,'8:00','12:00','13:00','17:00',0,0,1,NULL),(1810,116,30,'8:00','12:00','13:00','17:00',0,0,1,NULL);
/*!40000 ALTER TABLE `dtr_days` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dtrs`
--

DROP TABLE IF EXISTS `dtrs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dtrs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `month` varchar(100) DEFAULT NULL,
  `year` int(11) DEFAULT NULL,
  `working_hours` varchar(100) DEFAULT NULL,
  `verified_by` varchar(255) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `total_time` varchar(100) DEFAULT NULL,
  `uploaded_at` datetime DEFAULT current_timestamp(),
  `status` enum('pending','processed') DEFAULT 'pending',
  `processed_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_dtrs_user` (`user_id`),
  CONSTRAINT `fk_dtrs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=117 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dtrs`
--

LOCK TABLES `dtrs` WRITE;
/*!40000 ALTER TABLE `dtrs` DISABLE KEYS */;
INSERT INTO `dtrs` VALUES (115,7,'RINOA JAYNE M. CATANAOAN','August',2024,'8:00 - 12:00 pm and 1:00 - 5:00 pm','Not found','Principal','119 hours and 5 minutes','2025-05-21 15:34:39','pending',NULL),(116,7,'RINOA JAYNE M. CATANAOAN','July',2024,'8:00 - 12:00 pm and 1:00 - 5:00 pm','JUAN Z. DELA CRUZ','Principal','236 hours and 35 minutes','2025-05-21 16:11:07','processed','2025-05-21 16:11:13');
/*!40000 ALTER TABLE `dtrs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_profiles`
--

DROP TABLE IF EXISTS `employee_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `employee_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `employee_name` varchar(100) NOT NULL,
  `employment_type` enum('regular','irregular') NOT NULL,
  `base_salary_hour` decimal(10,2) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `sss_deduction` decimal(10,2) DEFAULT 0.00,
  `pagibig_deduction` decimal(10,2) DEFAULT 0.00,
  `philhealth_deduction` decimal(10,2) DEFAULT 0.00,
  `tax_deduction` decimal(10,2) DEFAULT 0.00,
  `leave_credits` float DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `employee_profiles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_profiles`
--

LOCK TABLES `employee_profiles` WRITE;
/*!40000 ALTER TABLE `employee_profiles` DISABLE KEYS */;
INSERT INTO `employee_profiles` VALUES (1,1,'john alasdsa','regular',60.00,'2025-05-09 16:23:47',0.00,0.00,0.00,0.00,0),(2,4,'','irregular',0.00,'2025-05-13 22:50:37',0.00,0.00,0.00,0.00,0),(3,5,'','regular',0.00,'2025-05-13 23:06:23',0.00,0.00,0.00,0.00,0),(4,6,'','irregular',0.00,'2025-05-14 10:41:01',0.00,0.00,0.00,0.00,0),(5,7,'rinoa jayne M. catanaoan','regular',130.00,'2025-05-15 16:48:34',100.00,200.00,500.00,2000.00,0),(6,8,'john alchristian','regular',0.00,'2025-05-16 14:08:00',0.00,0.00,0.00,0.00,0),(7,9,'von pelipe','regular',0.00,'2025-05-16 14:42:15',0.00,0.00,0.00,0.00,0);
/*!40000 ALTER TABLE `employee_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payslips`
--

DROP TABLE IF EXISTS `payslips`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payslips` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `dtr_id` int(11) NOT NULL,
  `month` varchar(100) NOT NULL,
  `year` int(11) NOT NULL,
  `working_days` int(11) DEFAULT NULL,
  `days_present` int(11) DEFAULT NULL,
  `days_absent` int(11) DEFAULT NULL,
  `leave_used` int(11) DEFAULT NULL,
  `total_hours` decimal(10,2) DEFAULT NULL,
  `gross_income` decimal(10,2) DEFAULT NULL,
  `total_deductions` decimal(10,2) DEFAULT NULL,
  `net_income` decimal(10,2) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sss_deduction` decimal(10,2) DEFAULT 0.00,
  `philhealth_deduction` decimal(10,2) DEFAULT 0.00,
  `pagibig_deduction` decimal(10,2) DEFAULT 0.00,
  `tax_deduction` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `dtr_id` (`dtr_id`),
  CONSTRAINT `payslips_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payslips_ibfk_2` FOREIGN KEY (`dtr_id`) REFERENCES `dtrs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payslips`
--

LOCK TABLES `payslips` WRITE;
/*!40000 ALTER TABLE `payslips` DISABLE KEYS */;
INSERT INTO `payslips` VALUES (37,7,116,'July',2024,23,30,0,0,238.00,30940.00,3024.29,27915.71,'2025-05-21 08:11:13',1076.40,598.00,100.00,1249.89);
/*!40000 ALTER TABLE `payslips` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(200) NOT NULL,
  `email` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'user',
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'john ','johnal@gmail.com','johnal','$2b$12$maHW3TlpTsq4VZy.YOOiTeKWrtCSlBRFDSkJsSrbtgxjlpvN0iL3W','user','2025-05-09 15:50:32'),(4,'rinoa jayne m. catanaoan','jr@gmail.com','jrluste','$2b$12$5xYEphWeiUnICn1m7/F9jewoU2Zc9fV0OZQm3.Vzh7.J4e4kDHRqy','user','2025-05-13 22:50:37'),(5,'johnal maralit','johnalbelarmino@gmail.com','akoto','$2b$12$FHfMJTYFNq2UtZfALVxR1.uH3e6FK1H4YkF01FvKRT/YlgmsHT4y2','user','2025-05-13 23:06:23'),(6,'john alchristian','test@gmail.com','test','$2b$12$LGZjOiMXYCuuhYgZ5yl/FOjSX30EzvqTg6TH/SIyrq/EcbBKRxdTK','user','2025-05-14 10:41:01'),(7,'rinoa jayne M. catanaoan','rinoa@gmai.com','rinoa','$2b$12$RUgtm/0W.6N0UbzqJATyt.fY.YzlQCXN43.2lozYufsgEq9MisyNy','user','2025-05-15 16:48:34'),(8,'john alchristian','johnalchristian@gmail.com','johnalchristian','$2b$12$ZE1HwlV9XiTMHm1G2zHRteoLrar1AWz3k4AUAyJT6o0msSw42wRR2','user','2025-05-16 14:08:00'),(9,'von pelipe','von@gmail.com','von','$2b$12$vGdsJ5yvqhzDeBbcUh6bbO0r6cy.6j/W8ECHlnbMwyKXP9VJDgHZO','user','2025-05-16 14:42:15');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-05-21 19:21:26
