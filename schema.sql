/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`recycle` /*!40100 DEFAULT CHARACTER SET utf8 COLLATE utf8_unicode_ci */;

/*Table structure for table `material_mapping` */

DROP TABLE IF EXISTS `material_mapping`;

CREATE TABLE `material_mapping` (
  `alias` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  `material` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`alias`,`material`),
  KEY `material` (`material`),
  CONSTRAINT `material_mapping_ibfk_1` FOREIGN KEY (`material`) REFERENCES `spot_material` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*Table structure for table `spot` */

DROP TABLE IF EXISTS `spot`;

CREATE TABLE `spot` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `type` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `organisation` varchar(64) COLLATE utf8_unicode_ci DEFAULT NULL,
  `area` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'kvartal',
  `address` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  `lng` float DEFAULT NULL,
  `lat` float DEFAULT NULL,
  `added_at` datetime DEFAULT NULL,
  `description` text COLLATE utf8_unicode_ci,
  `contact` text COLLATE utf8_unicode_ci,
  `pointer` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL COMMENT 'path to custom pointer',
  `streetview_params` varchar(255) COLLATE utf8_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `type` (`type`),
  CONSTRAINT `spot_ibfk_1` FOREIGN KEY (`type`) REFERENCES `spot_type` (`name`) ON DELETE SET NULL ON UPDATE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*Table structure for table `spot_material` */

DROP TABLE IF EXISTS `spot_material`;

CREATE TABLE `spot_material` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*Table structure for table `spot_material_link` */

DROP TABLE IF EXISTS `spot_material_link`;

CREATE TABLE `spot_material_link` (
  `spot` int(11) unsigned NOT NULL,
  `material` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`spot`,`material`),
  KEY `material` (`material`),
  CONSTRAINT `spot_material_link_ibfk_2` FOREIGN KEY (`spot`) REFERENCES `spot` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `spot_material_link_ibfk_1` FOREIGN KEY (`material`) REFERENCES `spot_material` (`name`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*Table structure for table `spot_type` */

DROP TABLE IF EXISTS `spot_type`;

CREATE TABLE `spot_type` (
  `name` varchar(255) COLLATE utf8_unicode_ci NOT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
