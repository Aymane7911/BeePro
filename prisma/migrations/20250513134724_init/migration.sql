-- CreateTable
CREATE TABLE "beeusers" (
    "id" SERIAL NOT NULL,
    "firstname" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phonenumber" TEXT,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmation_token" TEXT,
    "is_confirmed" BOOLEAN NOT NULL DEFAULT false,
    "passport_id" TEXT,
    "passport_file" TEXT,
    "phone_confirmed" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "beeusers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "beeusers_email_key" ON "beeusers"("email");

-- CreateIndex
CREATE UNIQUE INDEX "beeusers_phonenumber_key" ON "beeusers"("phonenumber");
