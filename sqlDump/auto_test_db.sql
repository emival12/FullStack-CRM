-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: auto_test_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` int NOT NULL AUTO_INCREMENT,
  `object_name` varchar(255) NOT NULL DEFAULT 'account',
  `record_type_name` varchar(255) NOT NULL DEFAULT 'master',
  `create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(255) NOT NULL,
  `tot_contacts` decimal(16,2) DEFAULT NULL,
  `inactive_rollup` decimal(16,2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,'account','cliente','2026-08-03 11:46:44','2026-08-03 12:25:45','1',1.00,NULL),(3,'account','cliente','2026-08-05 18:18:28','2026-08-05 18:18:28','1',0.00,NULL);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `aggregation_function`
--

DROP TABLE IF EXISTS `aggregation_function`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `aggregation_function` (
  `name` varchar(15) NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `aggregation_function`
--

LOCK TABLES `aggregation_function` WRITE;
/*!40000 ALTER TABLE `aggregation_function` DISABLE KEYS */;
INSERT INTO `aggregation_function` VALUES ('MAX'),('MIN'),('SUM');
/*!40000 ALTER TABLE `aggregation_function` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contact`
--

DROP TABLE IF EXISTS `contact`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact` (
  `telefono` varchar(255) NOT NULL,
  `object_name` varchar(255) NOT NULL DEFAULT 'contact',
  `record_type_name` varchar(255) NOT NULL DEFAULT 'master',
  `create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(255) NOT NULL,
  `account` int DEFAULT NULL,
  `counter` varchar(255) DEFAULT NULL,
  `priority` varchar(255) DEFAULT NULL,
  `inactive_field` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`telefono`),
  KEY `fk_contact_account` (`account`),
  CONSTRAINT `fk_contact_account` FOREIGN KEY (`account`) REFERENCES `account` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contact`
--

LOCK TABLES `contact` WRITE;
/*!40000 ALTER TABLE `contact` DISABLE KEYS */;
INSERT INTO `contact` VALUES ('1234','contact','master','2026-08-03 11:46:51','2026-08-03 12:25:45','1',1,'1',NULL,NULL);
/*!40000 ALTER TABLE `contact` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `field_definition`
--

DROP TABLE IF EXISTS `field_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `field_definition` (
  `object_name` varchar(100) NOT NULL,
  `record_type_name` varchar(100) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `field_type` varchar(20) NOT NULL,
  `length` int DEFAULT NULL,
  `numeric_precision` tinyint DEFAULT NULL,
  `numeric_scale` tinyint DEFAULT NULL,
  `reference_object` varchar(100) DEFAULT NULL,
  `reference_field` varchar(255) DEFAULT NULL,
  `lookup_filter` varchar(1000) DEFAULT NULL,
  `formula_definition` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_visible` tinyint(1) DEFAULT '1',
  `is_editable` tinyint(1) DEFAULT '1',
  `is_required` tinyint(1) DEFAULT '0',
  `is_primary_key` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`object_name`,`record_type_name`,`field_name`),
  KEY `idx_reference_object` (`reference_object`),
  CONSTRAINT `field_definition_ibfk_1` FOREIGN KEY (`object_name`) REFERENCES `object_definition` (`object_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `field_definition`
--

LOCK TABLES `field_definition` WRITE;
/*!40000 ALTER TABLE `field_definition` DISABLE KEYS */;
INSERT INTO `field_definition` VALUES ('account','cliente','create_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('account','cliente','id','auto_number',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,1),('account','cliente','inactive_rollup','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,0,1,1,0,0),('account','cliente','last_modified_by','lookup',255,NULL,NULL,'user_definition','email',NULL,NULL,1,1,0,0,0),('account','cliente','last_modified_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('account','cliente','record_type_name','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,1,0),('account','cliente','tot_contacts','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,1,1,1,0,0),('account','fornitore','create_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('account','fornitore','id','auto_number',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,1),('account','fornitore','inactive_rollup','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,0,1,1,0,0),('account','fornitore','last_modified_by','lookup',255,NULL,NULL,'user_definition','email',NULL,NULL,1,1,0,0,0),('account','fornitore','last_modified_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('account','fornitore','record_type_name','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,1,0),('account','fornitore','tot_contacts','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,1,1,1,0,0),('account','master','create_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,0,0,0),('account','master','id','auto_number',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,0,0,1),('account','master','inactive_rollup','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,0,1,1,0,0),('account','master','last_modified_by','lookup',255,NULL,NULL,'user_definition','email',NULL,NULL,0,1,0,0,0),('account','master','last_modified_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,0,0,0),('account','master','record_type_name','text',255,NULL,NULL,NULL,NULL,NULL,NULL,0,0,0,1,0),('account','master','tot_contacts','rollup',NULL,NULL,NULL,'contact','counter',NULL,NULL,0,1,1,0,0),('contact','master','account','lookup',NULL,NULL,NULL,'account','id','',NULL,1,1,1,1,0),('contact','master','counter','formula',255,NULL,NULL,NULL,NULL,NULL,'1',1,0,0,0,0),('contact','master','create_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('contact','master','inactive_field','text',10,NULL,NULL,NULL,NULL,NULL,NULL,0,1,1,0,0),('contact','master','last_modified_by','lookup',255,NULL,NULL,'user_definition','email',NULL,NULL,1,1,0,0,0),('contact','master','last_modified_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('contact','master','priority','radio',255,NULL,NULL,NULL,NULL,NULL,NULL,1,1,1,0,0),('contact','master','record_type_name','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,1,0),('contact','master','telefono','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,1,1,1,1),('product','master','create_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('product','master','id','auto_number',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,1),('product','master','last_modified_by','lookup',255,NULL,NULL,'user_definition','email',NULL,NULL,1,1,0,0,0),('product','master','last_modified_date','datetime-local',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('product','master','record_type_name','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,0,0,1,0),('user_definition','master','email','text',255,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,0),('user_definition','master','id','auto_number',NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,0,0,1);
/*!40000 ALTER TABLE `field_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `list_view_definition`
--

DROP TABLE IF EXISTS `list_view_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `list_view_definition` (
  `object_name` varchar(100) NOT NULL,
  `record_type_name` varchar(100) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `sort_order` smallint DEFAULT NULL,
  PRIMARY KEY (`object_name`,`record_type_name`,`field_name`),
  CONSTRAINT `list_view_definition_ibfk_1` FOREIGN KEY (`object_name`, `record_type_name`, `field_name`) REFERENCES `field_definition` (`object_name`, `record_type_name`, `field_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `list_view_definition`
--

LOCK TABLES `list_view_definition` WRITE;
/*!40000 ALTER TABLE `list_view_definition` DISABLE KEYS */;
INSERT INTO `list_view_definition` VALUES ('account','cliente','id',1),('account','fornitore','id',1),('account','master','id',1),('contact','master','counter',2),('contact','master','telefono',1),('product','master','id',1);
/*!40000 ALTER TABLE `list_view_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `object_definition`
--

DROP TABLE IF EXISTS `object_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `object_definition` (
  `object_label` varchar(100) NOT NULL,
  `object_name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `sort_order` smallint DEFAULT NULL,
  `is_system_object` tinyint(1) DEFAULT '0',
  `is_single_record_type` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`object_name`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `object_definition`
--

LOCK TABLES `object_definition` WRITE;
/*!40000 ALTER TABLE `object_definition` DISABLE KEYS */;
INSERT INTO `object_definition` VALUES ('account','account','Sales',2,0,0),('contact','contact','Sales',3,0,1),('product','product','Sales',1,0,1),('user_definition','user_definition','system',1,1,1);
/*!40000 ALTER TABLE `object_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `id` int NOT NULL AUTO_INCREMENT,
  `object_name` varchar(255) NOT NULL DEFAULT 'product',
  `record_type_name` varchar(255) NOT NULL DEFAULT 'master',
  `create_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_modified_date` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_modified_by` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,'product','master','2026-08-03 15:16:18','2026-08-03 15:16:18','1'),(2,'product','master','2026-08-03 15:22:38','2026-08-03 15:22:38','1');
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `radio_checkbox_options`
--

DROP TABLE IF EXISTS `radio_checkbox_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `radio_checkbox_options` (
  `object_name` varchar(100) NOT NULL,
  `record_type_name` varchar(100) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `option_key` varchar(255) NOT NULL,
  `option_label` varchar(255) DEFAULT NULL,
  `sort_order` smallint DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`object_name`,`record_type_name`,`field_name`,`option_key`),
  CONSTRAINT `radio_checkbox_options_ibfk_1` FOREIGN KEY (`object_name`, `record_type_name`, `field_name`) REFERENCES `field_definition` (`object_name`, `record_type_name`, `field_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `radio_checkbox_options`
--

LOCK TABLES `radio_checkbox_options` WRITE;
/*!40000 ALTER TABLE `radio_checkbox_options` DISABLE KEYS */;
INSERT INTO `radio_checkbox_options` VALUES ('contact','master','priority','high','High',0,1),('contact','master','priority','inactive','Inactive',4,0),('contact','master','priority','low','Low',2,1),('contact','master','priority','medium','Medium',1,1);
/*!40000 ALTER TABLE `radio_checkbox_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `record_layout_definition`
--

DROP TABLE IF EXISTS `record_layout_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `record_layout_definition` (
  `object_name` varchar(100) NOT NULL,
  `record_type_name` varchar(100) NOT NULL,
  `field_name` varchar(255) NOT NULL,
  `sort_order` smallint DEFAULT NULL,
  PRIMARY KEY (`object_name`,`record_type_name`,`field_name`),
  CONSTRAINT `record_layout_definition_ibfk_1` FOREIGN KEY (`object_name`, `record_type_name`, `field_name`) REFERENCES `field_definition` (`object_name`, `record_type_name`, `field_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `record_layout_definition`
--

LOCK TABLES `record_layout_definition` WRITE;
/*!40000 ALTER TABLE `record_layout_definition` DISABLE KEYS */;
INSERT INTO `record_layout_definition` VALUES ('account','cliente','create_date',2),('account','cliente','id',1),('account','cliente','inactive_rollup',6),('account','cliente','last_modified_by',4),('account','cliente','last_modified_date',3),('account','cliente','tot_contacts',5),('account','fornitore','create_date',2),('account','fornitore','id',1),('account','fornitore','inactive_rollup',6),('account','fornitore','last_modified_by',4),('account','fornitore','last_modified_date',3),('account','fornitore','tot_contacts',5),('account','master','create_date',2),('account','master','id',1),('account','master','inactive_rollup',6),('account','master','last_modified_by',4),('account','master','last_modified_date',3),('account','master','tot_contacts',5),('contact','master','account',5),('contact','master','counter',6),('contact','master','create_date',2),('contact','master','inactive_field',8),('contact','master','last_modified_by',4),('contact','master','last_modified_date',3),('contact','master','priority',7),('contact','master','telefono',1),('product','master','create_date',2),('product','master','id',1),('product','master','last_modified_by',4),('product','master','last_modified_date',3);
/*!40000 ALTER TABLE `record_layout_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `record_type_definition`
--

DROP TABLE IF EXISTS `record_type_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `record_type_definition` (
  `object_name` varchar(100) NOT NULL,
  `record_type_name` varchar(100) NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`object_name`,`record_type_name`),
  CONSTRAINT `record_type_definition_ibfk_1` FOREIGN KEY (`object_name`) REFERENCES `object_definition` (`object_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `record_type_definition`
--

LOCK TABLES `record_type_definition` WRITE;
/*!40000 ALTER TABLE `record_type_definition` DISABLE KEYS */;
INSERT INTO `record_type_definition` VALUES ('account','cliente',1),('account','fornitore',1),('account','master',0),('contact','master',1),('product','master',1),('user_definition','master',1);
/*!40000 ALTER TABLE `record_type_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `related_list_definition`
--

DROP TABLE IF EXISTS `related_list_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `related_list_definition` (
  `master_object_name` varchar(100) NOT NULL,
  `master_record_type_name` varchar(100) NOT NULL,
  `child_primary_key` varchar(255) DEFAULT NULL,
  `child_object_name` varchar(100) NOT NULL,
  `child_record_type_name` varchar(100) NOT NULL,
  `child_join_key` varchar(255) NOT NULL,
  `label` varchar(255) NOT NULL,
  `sort_order` smallint DEFAULT NULL,
  `filter_condition` varchar(1000) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`master_object_name`,`master_record_type_name`,`child_object_name`,`child_record_type_name`,`label`),
  KEY `child_object_name` (`child_object_name`,`child_record_type_name`,`child_join_key`),
  CONSTRAINT `related_list_definition_ibfk_1` FOREIGN KEY (`child_object_name`, `child_record_type_name`, `child_join_key`) REFERENCES `field_definition` (`object_name`, `record_type_name`, `field_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `related_list_definition`
--

LOCK TABLES `related_list_definition` WRITE;
/*!40000 ALTER TABLE `related_list_definition` DISABLE KEYS */;
INSERT INTO `related_list_definition` VALUES ('account','cliente','telefono','contact','master','account','Contact',1,NULL,1),('account','fornitore','telefono','contact','master','account','Contact',1,NULL,1),('account','master','telefono','contact','master','account','Contact',1,NULL,0);
/*!40000 ALTER TABLE `related_list_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rollup_definition`
--

DROP TABLE IF EXISTS `rollup_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rollup_definition` (
  `master_object_name` varchar(100) NOT NULL,
  `master_record_type_name` varchar(100) NOT NULL,
  `master_primary_key` varchar(255) DEFAULT NULL,
  `master_field_name` varchar(255) NOT NULL,
  `detail_object_name` varchar(100) NOT NULL,
  `detail_join_key` varchar(255) NOT NULL,
  `detail_field_name` varchar(255) NOT NULL,
  `aggregation_function` varchar(15) NOT NULL,
  `filter_condition` varchar(1000) DEFAULT NULL,
  PRIMARY KEY (`master_object_name`,`master_record_type_name`,`master_field_name`,`aggregation_function`),
  KEY `aggregation_function` (`aggregation_function`),
  CONSTRAINT `rollup_definition_ibfk_1` FOREIGN KEY (`master_object_name`, `master_record_type_name`, `master_field_name`) REFERENCES `field_definition` (`object_name`, `record_type_name`, `field_name`) ON DELETE CASCADE,
  CONSTRAINT `rollup_definition_ibfk_2` FOREIGN KEY (`aggregation_function`) REFERENCES `aggregation_function` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rollup_definition`
--

LOCK TABLES `rollup_definition` WRITE;
/*!40000 ALTER TABLE `rollup_definition` DISABLE KEYS */;
INSERT INTO `rollup_definition` VALUES ('account','cliente','id','inactive_rollup','contact','account','counter','MAX',NULL),('account','cliente','id','tot_contacts','contact','account','counter','SUM',NULL),('account','fornitore','id','inactive_rollup','contact','account','counter','MAX',NULL),('account','fornitore','id','tot_contacts','contact','account','counter','SUM',NULL),('account','master','id','inactive_rollup','contact','account','counter','MAX',NULL),('account','master','id','tot_contacts','contact','account','counter','SUM',NULL);
/*!40000 ALTER TABLE `rollup_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `trigger_definition`
--

DROP TABLE IF EXISTS `trigger_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `trigger_definition` (
  `object_name` varchar(100) NOT NULL,
  `trigger_timing` enum('BEFORE','AFTER') NOT NULL,
  `trigger_event` enum('INSERT','UPDATE','DELETE') NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`object_name`,`trigger_event`,`trigger_timing`),
  CONSTRAINT `trigger_definition_ibfk_1` FOREIGN KEY (`object_name`) REFERENCES `object_definition` (`object_name`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `trigger_definition`
--

LOCK TABLES `trigger_definition` WRITE;
/*!40000 ALTER TABLE `trigger_definition` DISABLE KEYS */;
INSERT INTO `trigger_definition` VALUES ('product','BEFORE','INSERT',0),('product','AFTER','INSERT',1);
/*!40000 ALTER TABLE `trigger_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_definition`
--

DROP TABLE IF EXISTS `user_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_definition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(100) NOT NULL,
  `profile_id` int NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `profile_id` (`profile_id`),
  CONSTRAINT `user_definition_ibfk_1` FOREIGN KEY (`profile_id`) REFERENCES `user_profile_definition` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_definition`
--

LOCK TABLES `user_definition` WRITE;
/*!40000 ALTER TABLE `user_definition` DISABLE KEYS */;
INSERT INTO `user_definition` VALUES (1,'admin@test.it','$2b$12$PsFMsB9oKRQOwE0emOQnLuMV5Uh1RkEA3IC5KYUiAEL/fQZz9ti0q',1,1),(2,'inactive@test.it','$2b$12$PsFMsB9oKRQOwE0emOQnLuMV5Uh1RkEA3IC5KYUiAEL/fQZz9ti0q',1,0);
/*!40000 ALTER TABLE `user_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profile_definition`
--

DROP TABLE IF EXISTS `user_profile_definition`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profile_definition` (
  `id` int NOT NULL AUTO_INCREMENT,
  `profile_name` varchar(100) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `profile_name` (`profile_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profile_definition`
--

LOCK TABLES `user_profile_definition` WRITE;
/*!40000 ALTER TABLE `user_profile_definition` DISABLE KEYS */;
INSERT INTO `user_profile_definition` VALUES (1,'System_Admin');
/*!40000 ALTER TABLE `user_profile_definition` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_session`
--

DROP TABLE IF EXISTS `user_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_session` (
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` int NOT NULL,
  `expires_at` datetime NOT NULL,
  PRIMARY KEY (`token`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_session_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user_definition` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_session`
--

LOCK TABLES `user_session` WRITE;
/*!40000 ALTER TABLE `user_session` DISABLE KEYS */;
INSERT INTO `user_session` VALUES ('M5X2Mv_dMZvmkiTtVc_AXrkCGaxlfBpZMKQL2mvRsJE',1,'2026-08-06 23:59:59');
/*!40000 ALTER TABLE `user_session` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-07 16:00:42
