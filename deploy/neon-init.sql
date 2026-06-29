-- =====================================================================
-- منصة مزاد — تهيئة قاعدة البيانات (المخطط + بيانات تجريبية)
-- الصق هذا الملف كاملاً في Neon SQL Editor ثم اضغط Run.
-- يُنشئ كل الجداول ويضيف تصنيفات وحسابات وإعلانات ومزاداً تجريبياً.
-- =====================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA IF NOT EXISTS public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: AuctionStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."AuctionStatus" AS ENUM (
    'SCHEDULED',
    'LIVE',
    'ENDED',
    'CANCELLED'
);


--
-- Name: CategoryLevel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."CategoryLevel" AS ENUM (
    'SPECIES',
    'TYPE',
    'BREED'
);


--
-- Name: IdentityStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."IdentityStatus" AS ENUM (
    'NONE',
    'PENDING',
    'VERIFIED'
);


--
-- Name: ListingStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ListingStatus" AS ENUM (
    'DRAFT',
    'ACTIVE',
    'SOLD',
    'CLOSED'
);


--
-- Name: MediaType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MediaType" AS ENUM (
    'IMAGE',
    'VIDEO',
    'VIDEO_360',
    'DOC'
);


--
-- Name: MessageType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."MessageType" AS ENUM (
    'TEXT',
    'IMAGE',
    'VOICE',
    'LOCATION'
);


--
-- Name: ReportStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReportStatus" AS ENUM (
    'OPEN',
    'REVIEWING',
    'RESOLVED',
    'REJECTED'
);


--
-- Name: ReviewRole; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."ReviewRole" AS ENUM (
    'BUYER',
    'SELLER',
    'BROKER'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'BROKER',
    'ADMIN'
);


--
-- Name: SaleType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."SaleType" AS ENUM (
    'DIRECT',
    'AUCTION'
);


--
-- Name: Sex; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Sex" AS ENUM (
    'MALE',
    'FEMALE',
    'MIXED'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Auction; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Auction" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "brokerId" text,
    "startPrice" numeric(12,2) NOT NULL,
    "minIncrement" numeric(12,2) DEFAULT 100 NOT NULL,
    "reservePrice" numeric(12,2),
    deposit numeric(12,2),
    "startAt" timestamp(3) without time zone NOT NULL,
    "endAt" timestamp(3) without time zone NOT NULL,
    "antiSnipingSec" integer DEFAULT 60 NOT NULL,
    status public."AuctionStatus" DEFAULT 'SCHEDULED'::public."AuctionStatus" NOT NULL,
    "highestBidId" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Bid; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Bid" (
    id text NOT NULL,
    "auctionId" text NOT NULL,
    "bidderId" text NOT NULL,
    amount numeric(12,2) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Category; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Category" (
    id text NOT NULL,
    name text NOT NULL,
    level public."CategoryLevel" NOT NULL,
    icon text,
    "parentId" text
);


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    "isPublic" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: HealthAttribute; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."HealthAttribute" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    key text NOT NULL,
    value boolean NOT NULL,
    note text
);


--
-- Name: Listing; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Listing" (
    id text NOT NULL,
    "sellerId" text NOT NULL,
    "categoryId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    count integer DEFAULT 1 NOT NULL,
    sex public."Sex" DEFAULT 'MIXED'::public."Sex" NOT NULL,
    "approxWeightKg" integer,
    "productionStatus" text,
    price numeric(12,2),
    "saleType" public."SaleType" DEFAULT 'DIRECT'::public."SaleType" NOT NULL,
    city text NOT NULL,
    region text NOT NULL,
    lat double precision,
    lng double precision,
    "hidePhone" boolean DEFAULT false NOT NULL,
    status public."ListingStatus" DEFAULT 'ACTIVE'::public."ListingStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Media; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Media" (
    id text NOT NULL,
    "listingId" text NOT NULL,
    type public."MediaType" DEFAULT 'IMAGE'::public."MediaType" NOT NULL,
    url text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL
);


--
-- Name: Message; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    type public."MessageType" DEFAULT 'TEXT'::public."MessageType" NOT NULL,
    body text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: OtpCode; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."OtpCode" (
    id text NOT NULL,
    phone text NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    consumed boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "userId" text
);


--
-- Name: Report; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Report" (
    id text NOT NULL,
    "reporterId" text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    reason text NOT NULL,
    status public."ReportStatus" DEFAULT 'OPEN'::public."ReportStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: Review; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "authorId" text NOT NULL,
    "targetId" text NOT NULL,
    role public."ReviewRole" NOT NULL,
    rating integer NOT NULL,
    "descMatch" integer,
    comment text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    phone text NOT NULL,
    name text NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL,
    "isPhoneVerified" boolean DEFAULT false NOT NULL,
    "identityStatus" public."IdentityStatus" DEFAULT 'NONE'::public."IdentityStatus" NOT NULL,
    city text,
    region text,
    "trustScore" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: Auction; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Auction" VALUES ('1e5180a8-5dfc-4e73-94ea-e1579c643378', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'e1dcb854-0d98-45ea-a8db-0028c01bbf0c', 15000.00, 500.00, 20000.00, 1000.00, '2026-06-29 11:06:57.574', '2026-06-30 11:06:57.574', 60, 'LIVE', 'dce852a2-d979-4c5f-9133-cc83d60e8757', '2026-06-29 11:06:57.575');


--
-- Data for Name: Bid; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Bid" VALUES ('0e3e114a-5579-4ca1-b116-eae887a20239', '1e5180a8-5dfc-4e73-94ea-e1579c643378', '8efef55e-5bf8-4434-b3f1-07dcdbd4ceba', 15000.00, '2026-06-29 11:06:57.577');
INSERT INTO public."Bid" VALUES ('dce852a2-d979-4c5f-9133-cc83d60e8757', '1e5180a8-5dfc-4e73-94ea-e1579c643378', 'e1dcb854-0d98-45ea-a8db-0028c01bbf0c', 16000.00, '2026-06-29 11:06:57.579');


--
-- Data for Name: Category; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Category" VALUES ('b128573d-1012-4ef4-adcc-07919f7dd1e9', 'إبل', 'SPECIES', '🐪', NULL);
INSERT INTO public."Category" VALUES ('3c084c5e-fa41-4b52-8224-ce92e4132e88', 'مجاهيم', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('ad4039bb-769b-49cf-ad9d-2b42831c98ef', 'مغاتير', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('37e06286-fce7-4db7-93d4-e295e8b08b63', 'وضح', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('464e5ee5-3431-4f12-8a70-2fd1663b56c5', 'صفر', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('11d52f2d-d993-45b6-b5b6-fce98f1b7c91', 'شعل', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('a988dc0a-c61a-4d51-8c44-b432a0d53491', 'حمر', 'BREED', NULL, 'b128573d-1012-4ef4-adcc-07919f7dd1e9');
INSERT INTO public."Category" VALUES ('39f25d09-1ad2-4644-b7ba-eceb86b3072e', 'غنم', 'SPECIES', '🐑', NULL);
INSERT INTO public."Category" VALUES ('3cb2eacf-9434-4a57-99eb-74ead0c392e1', 'نجدي', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('67d7556d-fdb5-4a11-8e55-dd3226ecc476', 'نعيمي', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('423d6bdc-2e58-4748-84c4-aa435a2a9bba', 'حري', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('3326105a-1fcd-4787-811d-5696d638b573', 'سواكني', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('2e12e530-611e-4868-8e38-66ba07728c59', 'بربري', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('0b5010c2-8275-4aad-a76e-2f05b2a64a0e', 'نقدي', 'BREED', NULL, '39f25d09-1ad2-4644-b7ba-eceb86b3072e');
INSERT INTO public."Category" VALUES ('39e9b463-7303-4378-9ef0-56792dd4b1a3', 'ماعز', 'SPECIES', '🐐', NULL);
INSERT INTO public."Category" VALUES ('bf176878-bfb1-41ff-b76c-5716d34436c0', 'عارضي', 'BREED', NULL, '39e9b463-7303-4378-9ef0-56792dd4b1a3');
INSERT INTO public."Category" VALUES ('8760e659-0345-49fa-a169-a68f1913c8b0', 'شامي', 'BREED', NULL, '39e9b463-7303-4378-9ef0-56792dd4b1a3');
INSERT INTO public."Category" VALUES ('7bfd1600-0ccf-407d-98b4-4ea3b1f36bbc', 'حجازي', 'BREED', NULL, '39e9b463-7303-4378-9ef0-56792dd4b1a3');
INSERT INTO public."Category" VALUES ('16772eaa-ef7f-4f7a-a864-e4944e7f2451', 'تهامي', 'BREED', NULL, '39e9b463-7303-4378-9ef0-56792dd4b1a3');
INSERT INTO public."Category" VALUES ('1b98dbf9-fec1-4a7e-821d-bfe42a676336', 'بقر', 'SPECIES', '🐄', NULL);
INSERT INTO public."Category" VALUES ('93662566-c053-46eb-956a-6b0ba30f4ea2', 'هولشتاين', 'BREED', NULL, '1b98dbf9-fec1-4a7e-821d-bfe42a676336');
INSERT INTO public."Category" VALUES ('4943b4da-c866-4d6c-9abc-46e07a1bd4e6', 'جيرسي', 'BREED', NULL, '1b98dbf9-fec1-4a7e-821d-bfe42a676336');
INSERT INTO public."Category" VALUES ('c611f49e-1ab1-4f5f-af4d-2b3e7070dcf2', 'بلدي', 'BREED', NULL, '1b98dbf9-fec1-4a7e-821d-bfe42a676336');
INSERT INTO public."Category" VALUES ('6488ebf1-8c2a-4225-8dc1-668659095833', 'خيل', 'SPECIES', '🐎', NULL);
INSERT INTO public."Category" VALUES ('4d8c70d7-9af8-4125-8eb1-5cd63e2d17e1', 'عربي أصيل', 'BREED', NULL, '6488ebf1-8c2a-4225-8dc1-668659095833');
INSERT INTO public."Category" VALUES ('1f5c2f80-7c63-44f0-8ad3-2e5816e4d473', 'واهو', 'BREED', NULL, '6488ebf1-8c2a-4225-8dc1-668659095833');
INSERT INTO public."Category" VALUES ('d4f224c5-2e1c-4f12-8233-67b4e426e10d', 'شعبي', 'BREED', NULL, '6488ebf1-8c2a-4225-8dc1-668659095833');


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: HealthAttribute; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."HealthAttribute" VALUES ('261b7607-cd51-4f98-b9ee-fadd70c4fd47', 'a8e8fd86-6bdb-4cab-b40b-6a92e10a3e82', 'vaccinated', true, 'مطعّم ضد الطاعون');
INSERT INTO public."HealthAttribute" VALUES ('d7612cb0-37c8-4d37-be03-592d8b2d9b45', 'a8e8fd86-6bdb-4cab-b40b-6a92e10a3e82', 'teeth', true, NULL);
INSERT INTO public."HealthAttribute" VALUES ('563a6978-f69b-4f72-8f64-72293ae0347c', 'a8e8fd86-6bdb-4cab-b40b-6a92e10a3e82', 'limp', false, NULL);
INSERT INTO public."HealthAttribute" VALUES ('e4f37cfe-0bd3-49dc-a34c-6c2dd590a0f5', '9da9b506-6cf2-44fd-b6c3-2cd9013ec39a', 'vaccinated', true, NULL);
INSERT INTO public."HealthAttribute" VALUES ('9cac777b-d51f-4459-a808-80388b95bbb1', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'vaccinated', true, NULL);
INSERT INTO public."HealthAttribute" VALUES ('d0bf1480-8f03-44c3-bde3-8937fcd140ab', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'udder', true, 'الضرع سليم');
INSERT INTO public."HealthAttribute" VALUES ('719232e1-639b-4bdb-93b1-2983a0e2a180', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'mange', false, NULL);
INSERT INTO public."HealthAttribute" VALUES ('191b3a78-99ae-4e0d-b8d8-7c17eae37d0f', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'abscess', false, NULL);


--
-- Data for Name: Listing; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Listing" VALUES ('a8e8fd86-6bdb-4cab-b40b-6a92e10a3e82', '8b252310-e471-41e5-9786-822c99c670a4', '3cb2eacf-9434-4a57-99eb-74ead0c392e1', 'خروف نجدي ممتاز جاهز للأضحية', 'خروف نجدي سمين، صحته ممتازة، مطعّم بالكامل. الموقع بريدة.', 1, 'MALE', 55, NULL, 1800.00, 'DIRECT', 'بريدة', 'القصيم', 26.359, 43.973, false, 'ACTIVE', '2026-06-29 11:06:57.564');
INSERT INTO public."Listing" VALUES ('9da9b506-6cf2-44fd-b6c3-2cd9013ec39a', '8b252310-e471-41e5-9786-822c99c670a4', 'bf176878-bfb1-41ff-b76c-5716d34436c0', 'تيس عارضي أصيل', 'تيس عارضي لون أسود، نشيط، مناسب للتربية.', 1, 'MALE', 40, NULL, 2500.00, 'DIRECT', 'عنيزة', 'القصيم', 26.094, 43.994, false, 'ACTIVE', '2026-06-29 11:06:57.569');
INSERT INTO public."Listing" VALUES ('54baf9e7-2c82-4b21-87a5-f6fb6f54659e', '8b252310-e471-41e5-9786-822c99c670a4', '3c084c5e-fa41-4b52-8224-ce92e4132e88', 'ناقة مجاهيم وضح — مزاد مفتوح', 'ناقة مجاهيم أصيلة، منتجة، خالية من العيوب. مزاد ينتهي خلال 24 ساعة.', 1, 'FEMALE', 450, 'منتجة', NULL, 'AUCTION', 'الرياض', 'الرياض', 24.713, 46.675, false, 'ACTIVE', '2026-06-29 11:06:57.572');


--
-- Data for Name: Media; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Media" VALUES ('f7c0b90a-bdb7-44af-8fe9-e93d68e7c49a', 'a8e8fd86-6bdb-4cab-b40b-6a92e10a3e82', 'IMAGE', 'https://images.unsplash.com/photo-1484557985045-edf25e08da73', 0);
INSERT INTO public."Media" VALUES ('8ee7be4f-58cb-4df9-9624-d9f2eed31fd6', '9da9b506-6cf2-44fd-b6c3-2cd9013ec39a', 'IMAGE', 'https://images.unsplash.com/photo-1524024973431-2ad916746881', 0);
INSERT INTO public."Media" VALUES ('7a12ebe9-fcfc-4777-b809-5af4f2c54832', '54baf9e7-2c82-4b21-87a5-f6fb6f54659e', 'IMAGE', 'https://images.unsplash.com/photo-1547234935-80c7145ec969', 0);


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: OtpCode; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Report; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Review" VALUES ('4fd232e8-4f91-454f-9d5f-003b8f8cb5cb', '8efef55e-5bf8-4434-b3f1-07dcdbd4ceba', '8b252310-e471-41e5-9786-822c99c670a4', 'SELLER', 5, 5, 'الوصف مطابق تماماً', '2026-06-29 11:06:57.561');
INSERT INTO public."Review" VALUES ('942ae6e5-4f12-4bc4-85ce-fc913ea91be1', 'e1dcb854-0d98-45ea-a8db-0028c01bbf0c', '8b252310-e471-41e5-9786-822c99c670a4', 'SELLER', 5, 4, NULL, '2026-06-29 11:06:57.561');


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" VALUES ('8b252310-e471-41e5-9786-822c99c670a4', '966500000001', 'أبو محمد القحطاني', 'USER', true, 'VERIFIED', 'بريدة', 'القصيم', 4.8, '2026-06-29 11:06:57.556');
INSERT INTO public."User" VALUES ('e1dcb854-0d98-45ea-a8db-0028c01bbf0c', '966500000002', 'دلال المنصة — سعد', 'BROKER', true, 'VERIFIED', 'الرياض', 'الرياض', 4.9, '2026-06-29 11:06:57.559');
INSERT INTO public."User" VALUES ('8efef55e-5bf8-4434-b3f1-07dcdbd4ceba', '966500000003', 'فهد العتيبي', 'USER', true, 'NONE', 'الرياض', 'الرياض', 4.5, '2026-06-29 11:06:57.56');


--
-- Name: Auction Auction_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auction"
    ADD CONSTRAINT "Auction_pkey" PRIMARY KEY (id);


--
-- Name: Bid Bid_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_pkey" PRIMARY KEY (id);


--
-- Name: Category Category_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: HealthAttribute HealthAttribute_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HealthAttribute"
    ADD CONSTRAINT "HealthAttribute_pkey" PRIMARY KEY (id);


--
-- Name: Listing Listing_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_pkey" PRIMARY KEY (id);


--
-- Name: Media Media_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OtpCode OtpCode_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpCode"
    ADD CONSTRAINT "OtpCode_pkey" PRIMARY KEY (id);


--
-- Name: Report Report_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Auction_listingId_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "Auction_listingId_key" ON public."Auction" USING btree ("listingId");


--
-- Name: Auction_status_endAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Auction_status_endAt_idx" ON public."Auction" USING btree (status, "endAt");


--
-- Name: Bid_auctionId_amount_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Bid_auctionId_amount_idx" ON public."Bid" USING btree ("auctionId", amount);


--
-- Name: Category_parentId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Category_parentId_idx" ON public."Category" USING btree ("parentId");


--
-- Name: Conversation_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Conversation_listingId_idx" ON public."Conversation" USING btree ("listingId");


--
-- Name: HealthAttribute_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "HealthAttribute_listingId_idx" ON public."HealthAttribute" USING btree ("listingId");


--
-- Name: Listing_categoryId_status_region_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_categoryId_status_region_idx" ON public."Listing" USING btree ("categoryId", status, region);


--
-- Name: Listing_status_createdAt_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Listing_status_createdAt_idx" ON public."Listing" USING btree (status, "createdAt");


--
-- Name: Media_listingId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Media_listingId_idx" ON public."Media" USING btree ("listingId");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: OtpCode_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "OtpCode_phone_idx" ON public."OtpCode" USING btree (phone);


--
-- Name: Review_targetId_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "Review_targetId_idx" ON public."Review" USING btree ("targetId");


--
-- Name: User_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX "User_phone_key" ON public."User" USING btree (phone);


--
-- Name: Auction Auction_brokerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auction"
    ADD CONSTRAINT "Auction_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Auction Auction_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Auction"
    ADD CONSTRAINT "Auction_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bid Bid_auctionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_auctionId_fkey" FOREIGN KEY ("auctionId") REFERENCES public."Auction"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bid Bid_bidderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Bid"
    ADD CONSTRAINT "Bid_bidderId_fkey" FOREIGN KEY ("bidderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Category Category_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Category"
    ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Conversation Conversation_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: HealthAttribute HealthAttribute_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."HealthAttribute"
    ADD CONSTRAINT "HealthAttribute_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Listing Listing_categoryId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES public."Category"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Listing Listing_sellerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Listing"
    ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Media Media_listingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Media"
    ADD CONSTRAINT "Media_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES public."Listing"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OtpCode OtpCode_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."OtpCode"
    ADD CONSTRAINT "OtpCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Report Report_reporterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Report"
    ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Review Review_targetId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


