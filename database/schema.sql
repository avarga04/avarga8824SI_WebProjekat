-- kreiranje baze (ako ne postoji)
CREATE DATABASE IF NOT EXISTS cms_vesti 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE cms_vesti;

-- korisnici
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    user_type ENUM('admin', 'creator') NOT NULL DEFAULT 'creator',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    password_hash VARCHAR(255) NOT NULL,  -- SHA256 hash (64 karaktera)
    
    INDEX idx_email (email),
    INDEX idx_user_type (user_type),
    INDEX idx_status (status)
);

-- kategorije 
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    
    INDEX idx_name (name)
);

-- vest
CREATE TABLE news (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    content LONGTEXT NOT NULL,
    published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    views INT NOT NULL DEFAULT 0,
    author_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    likes INT NOT NULL DEFAULT 0,
    dislikes INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT, 
    INDEX idx_published_at (published_at),
    INDEX idx_views (views),
    INDEX idx_author (author_id),
    INDEX idx_category (category_id),
    FULLTEXT INDEX idx_search (title, content)  -
);

-- tagovi 
CREATE TABLE tags (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL UNIQUE,
    
    INDEX idx_name (name)
);

-- povezivanje vesti i tagova 
CREATE TABLE news_tags (
    news_id INT NOT NULL,
    tag_id INT NOT NULL,
    PRIMARY KEY (news_id, tag_id),
    
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- komentari 
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    author_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    news_id INT NOT NULL,
    likes INT NOT NULL DEFAULT 0,
    dislikes INT NOT NULL DEFAULT 0,
    
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    INDEX idx_news_id (news_id),
    INDEX idx_created_at (created_at)
);

-- praćenje jedinstvenih pregleda vesti 
CREATE TABLE news_views (
    id INT PRIMARY KEY AUTO_INCREMENT,
    news_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,  
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    UNIQUE KEY unique_news_session (news_id, session_id),  
    INDEX idx_session (session_id)
);

-- reakcije na vesti lajk/dislajk
CREATE TABLE news_reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    news_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    reaction_type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (news_id) REFERENCES news(id) ON DELETE CASCADE,
    UNIQUE KEY unique_news_reaction (news_id, session_id),  
    INDEX idx_session (session_id),
    INDEX idx_type (reaction_type)
);

-- reakcije na komentare
CREATE TABLE comment_reactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    comment_id INT NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    reaction_type ENUM('like', 'dislike') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
    UNIQUE KEY unique_comment_reaction (comment_id, session_id),  
    INDEX idx_session (session_id),
    INDEX idx_type (reaction_type)
);

-- INSERT PODACI!

-- admin korisnik
INSERT INTO users (email, first_name, last_name, user_type, status, password_hash) VALUES
('anja@gmail.com', 'Anja', 'Varga', 'admin', 'active', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

-- kategorije
INSERT INTO categories (name, description) VALUES
('Sport', 'Sportske vesti, rezultati, transferi i analize'),
('Tehnologija', 'IT vesti, gadgeti, AI i software development'),
('Politika', 'Aktuelne političke vesti i analize'),
('Zabava', 'Film, muzika, serije i celebrity vesti'),
('Biznis', 'Privreda, berza, startup i ekonomija');

-- Peca kreator
INSERT INTO users (email, first_name, last_name, user_type, status, password_hash) VALUES
('petarp@example.com', 'Petar', 'Petrović', 'creator', 'active', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9');

-- vesti 
INSERT INTO news (title, content, author_id, category_id) VALUES
('Đoković osvojio turnir u Rimu', 
 'Novak Đoković je večeras osvojio turnir u Rimu pobedom protiv... (ovde ide ceo tekst vesti)',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Sport')),
('Beogradski stadion dobija modernizaciju',
 'Grad Beograd i sportski savez najavili su novi plan modernizacije stadiona i prateće infrastrukture.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Sport')),
('OpenAI predstavio novi model za obradu teksta',
 'Novi model donosi bržu obradu, bolju tačnost i naprednije razumevanje konteksta za korisnike i developere.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Tehnologija')),
('Vlada usvojila paket ekonomskih mera',
 'Usvojen je novi paket mera za podršku privredi, građanima i malim preduzećima u narednom kvartalu.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Politika')),
('Film godine oborio rekorde na blagajnama',
 'Novi bioskopski hit privukao je ogromnu publiku i oborio dosadašnje rekorde gledanosti.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Zabava')),
('Srpski startap privukao veliku investiciju',
 'Startap iz Beograda obezbedio je značajna sredstva za širenje na evropsko tržište.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Biznis')),
('Novi rekord na stazi oduševio publiku',
 'Atletičar je postavio novi rekord i tako obeležio jedno od najuzbudljivijih takmičenja sezone.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Sport')),
('Pametni telefoni dobijaju baterije nove generacije',
 'Proizvođači najavljuju baterije sa bržim punjenjem i dužim vekom trajanja.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Tehnologija')),
('Izbori u lokalnim zajednicama doneli tesnu trku',
 'Rezultati izbora pokazuju veliku izlaznost i neizvesnost u više opština.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Politika')),
('Koncerti na otvorenom pune trgove širom regiona',
 'Letnja sezona donela je veliki broj koncerata i događaja na otvorenom uz odličnu posetu.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Zabava')),
('Inflacija usporava, tržište pokazuje znake oporavka',
 'Ekonomisti navode da se inflacija smiruje, a tržište daje prve znake stabilizacije.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Biznis')),
('Reprezentacija Srbije počinje pripreme za kvalifikacije',
 'Selektor je objavio širi spisak i najavio intenzivne pripreme pred naredne kvalifikacione mečeve.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Sport')),
('Nova aplikacija olakšava učenje programiranja',
 'Aplikacija kombinuje kratke lekcije, praktične zadatke i AI pomoć za početnike.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Tehnologija')),
('Skupština raspravlja o zakonu o digitalnoj bezbednosti',
 'Predlog zakona uvodi nove mere za zaštitu podataka i bolji nadzor nad digitalnim uslugama.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Politika')),
('Popularna serija dobija poslednju sezonu',
 'Producenti su potvrdili završnu sezonu jedne od najgledanijih serija poslednjih godina.',
 (SELECT id FROM users WHERE email = 'petarp@example.com'),
 (SELECT id FROM categories WHERE name = 'Zabava'));

-- tagovi
INSERT INTO tags (name) VALUES
('tenis'), ('novak'), ('atp'), ('rim'), ('srbija'),
('stadion'), ('fudbal'), ('sport'), ('tehnologija'), ('ai'), ('openai'),
('ekonomija'), ('politika'), ('izbori'), ('film'), ('serija'),
('muzika'), ('zabava'), ('investicija'), ('startap'), ('bezbednost'), ('obrazovanje'),
('baterija'), ('reprezentacija'), ('rekordi'), ('inflacija'), ('aplikacija'), ('programiranje');

-- povezivanje vesti sa tagovima
INSERT INTO news_tags (news_id, tag_id) VALUES
(1, (SELECT id FROM tags WHERE name = 'tenis')),
(1, (SELECT id FROM tags WHERE name = 'novak')),
 (1, (SELECT id FROM tags WHERE name = 'atp')),
(1, (SELECT id FROM tags WHERE name = 'rim')),
(2, (SELECT id FROM tags WHERE name = 'stadion')),
(2, (SELECT id FROM tags WHERE name = 'fudbal')),
(2, (SELECT id FROM tags WHERE name = 'srbija')),
(3, (SELECT id FROM tags WHERE name = 'tehnologija')),
(3, (SELECT id FROM tags WHERE name = 'ai')),
(3, (SELECT id FROM tags WHERE name = 'openai')),
(4, (SELECT id FROM tags WHERE name = 'politika')),
(4, (SELECT id FROM tags WHERE name = 'ekonomija')),
(5, (SELECT id FROM tags WHERE name = 'film')),
(5, (SELECT id FROM tags WHERE name = 'zabava')),
(6, (SELECT id FROM tags WHERE name = 'investicija')),
(6, (SELECT id FROM tags WHERE name = 'startap')),
(7, (SELECT id FROM tags WHERE name = 'rekordi')),
(7, (SELECT id FROM tags WHERE name = 'sport')),
(8, (SELECT id FROM tags WHERE name = 'baterija')),
(8, (SELECT id FROM tags WHERE name = 'tehnologija')),
(9, (SELECT id FROM tags WHERE name = 'izbori')),
(9, (SELECT id FROM tags WHERE name = 'politika')),
(10, (SELECT id FROM tags WHERE name = 'muzika')),
(10, (SELECT id FROM tags WHERE name = 'zabava')),
(11, (SELECT id FROM tags WHERE name = 'inflacija')),
(11, (SELECT id FROM tags WHERE name = 'ekonomija')),
(12, (SELECT id FROM tags WHERE name = 'reprezentacija')),
(12, (SELECT id FROM tags WHERE name = 'srbija')),
(13, (SELECT id FROM tags WHERE name = 'aplikacija')),
(13, (SELECT id FROM tags WHERE name = 'programiranje')),
(13, (SELECT id FROM tags WHERE name = 'obrazovanje')),
(14, (SELECT id FROM tags WHERE name = 'bezbednost')),
(14, (SELECT id FROM tags WHERE name = 'politika')),
(15, (SELECT id FROM tags WHERE name = 'serija')),
(15, (SELECT id FROM tags WHERE name = 'zabava'));

-- komentari
INSERT INTO comments (author_name, content, news_id) VALUES
('Marko Marković', 'Bravo Novak! Još jedan u nizu!', 1),
('Ana Anić', 'Sjajna vest, hvala na izveštaju', 1),
('Milan Jovanović', 'Odličan pregled sportskih događaja.', 2),
('Jelena Petrović', 'Veoma zanimljivo, jedva čekam nastavak razvoja događaja.', 3),
('Dušan Ilić', 'Konačno konkretne mere za ekonomiju.', 4),
('Ivana Stojanović', 'Film izgleda kao pravi hit, idem u bioskop ovog vikenda.', 5),
('Nemanja Ristić', 'Pametna investicija za domaći startap ekosistem.', 6),
('Tamara Nikolić', 'Sjajan rezultat, zasluženo oboren rekord.', 7),
('Nikola Savić', 'Baterije su baš ono što tržištu treba.', 8),
('Sara Pavlović', 'Izbori su bili napeti do samog kraja.', 9),
('Vuk Milenković', 'Letnji koncerti su najbolji deo sezone.', 10),
('Milica Radović', 'Ako inflacija pada, to je dobra vest za sve.', 11),
('Luka Đorđević', 'Pripreme reprezentacije deluju obećavajuće.', 12),
('Tea Kovačević', 'Odličan tekst za početnike koji žele da uče programiranje.', 13),
('Ognjen Marković', 'Važno je da zakon dobro štiti podatke građana.', 14),
('Andrea Janković', 'Poslednja sezona će sigurno privući mnogo publike.', 15);

SHOW TABLES;

SELECT 
    TABLE_NAME,
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'cms_vesti'
ORDER BY TABLE_NAME, ORDINAL_POSITION;