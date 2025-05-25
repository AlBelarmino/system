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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'john ','johnal@gmail.com','johnal','$2b$12$maHW3TlpTsq4VZy.YOOiTeKWrtCSlBRFDSkJsSrbtgxjlpvN0iL3W','user','2025-05-09 15:50:32'),(4,'rinoa jayne m. catanaoan','jr@gmail.com','jrluste','$2b$12$5xYEphWeiUnICn1m7/F9jewoU2Zc9fV0OZQm3.Vzh7.J4e4kDHRqy','user','2025-05-13 22:50:37'),(5,'johnal maralit','johnalbelarmino@gmail.com','akoto','$2b$12$FHfMJTYFNq2UtZfALVxR1.uH3e6FK1H4YkF01FvKRT/YlgmsHT4y2','user','2025-05-13 23:06:23'),(6,'john alchristian','test@gmail.com','test','$2b$12$LGZjOiMXYCuuhYgZ5yl/FOjSX30EzvqTg6TH/SIyrq/EcbBKRxdTK','user','2025-05-14 10:41:01'),(7,'Rinoa Jayne M. Catanaoan','rinoa@gmai.com','rinoa','$2b$12$RUgtm/0W.6N0UbzqJATyt.fY.YzlQCXN43.2lozYufsgEq9MisyNy','user','2025-05-15 16:48:34'),(8,'john alchristian','johnalchristian@gmail.com','johnalchristian','$2b$12$ZE1HwlV9XiTMHm1G2zHRteoLrar1AWz3k4AUAyJT6o0msSw42wRR2','user','2025-05-16 14:08:00'),(9,'von pelipe','von@gmail.com','von','$2b$12$vGdsJ5yvqhzDeBbcUh6bbO0r6cy.6j/W8ECHlnbMwyKXP9VJDgHZO','user','2025-05-16 14:42:15'),(10,'employee 1','employee@gmail.com','employee1','$2b$12$QCFfA.JyGRPE57ojqHR2oeikePBKmNg9lyIvLXPckRd7noa4Evm4W','user','2025-05-23 18:40:42');
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

-- Dump completed on 2025-05-25 22:55:16
