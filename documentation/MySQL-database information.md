** MySQL Connection info

Server Host: 92.112.184.206  Port: 3306
Database: aisearchscore
Username: nimdas
Password: FormR!1234

** aisearchscore.searches table definition

CREATE TABLE `searches` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TestCode` char(12) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PcCode` char(6) DEFAULT NULL,
  `PcCPU` char(100) DEFAULT NULL,
  `PcGraphics` char(100) DEFAULT NULL,
  `PcRAM` char(10) DEFAULT NULL,
  `PcOS` char(10) DEFAULT NULL,
  `CreatedAt` char(19) DEFAULT NULL,
  `Prompt` longblob,
  `ModelName-search` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ModelContextSize-search` int DEFAULT NULL,
  `ModelTemperature-search` float DEFAULT NULL,
  `Duration-search-s` float DEFAULT NULL,
  `Load-search-ms` int DEFAULT NULL,
  `EvalTokensPerSecond-ssearch` float DEFAULT NULL,
  `Answer-search` longblob,
  `ModelName-score` char(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci DEFAULT NULL,
  `ModelContextSize-score` int DEFAULT NULL,
  `ModelTemperature-score` float DEFAULT NULL,
  `Duration-score-s` float DEFAULT NULL,
  `Load-score-ms` int DEFAULT NULL,
  `EvalTokensPerSecond-score` float DEFAULT NULL,
  `AccurateScore` int DEFAULT NULL,
  `RelevantScore` int DEFAULT NULL,
  `OrganizedScore` int DEFAULT NULL,
  `WeightedScore-pct` int DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `RunKey` (`CreatedAt`,`TestCode`,`PcCode`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


