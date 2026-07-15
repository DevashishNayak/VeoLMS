-- Expand → copy → drop: youtubeId/videoUrl → videoProvider/videoSrc

DO $$ BEGIN
  CREATE TYPE "VideoProvider" AS ENUM ('YOUTUBE', 'VIMEO', 'FILE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'videoProvider'
  ) THEN
    ALTER TABLE "Lesson" ADD COLUMN "videoProvider" "VideoProvider";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'videoSrc'
  ) THEN
    ALTER TABLE "Lesson" ADD COLUMN "videoSrc" TEXT;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerProvider'
  ) THEN
    ALTER TABLE "Course" ADD COLUMN "trailerProvider" "VideoProvider";
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerSrc'
  ) THEN
    ALTER TABLE "Course" ADD COLUMN "trailerSrc" TEXT;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'youtubeId'
  ) THEN
    EXECUTE $sql$
      UPDATE "Lesson"
      SET "videoProvider" = 'YOUTUBE', "videoSrc" = "youtubeId"
      WHERE "youtubeId" IS NOT NULL
        AND TRIM("youtubeId") <> ''
        AND ("videoSrc" IS NULL OR "videoSrc" = '')
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'videoUrl'
  ) THEN
    EXECUTE $sql$
      UPDATE "Lesson"
      SET "videoProvider" = 'VIMEO', "videoSrc" = "videoUrl"
      WHERE ("youtubeId" IS NULL OR TRIM("youtubeId") = '')
        AND "videoUrl" IS NOT NULL
        AND "videoUrl" ILIKE '%vimeo.com%'
        AND ("videoSrc" IS NULL OR "videoSrc" = '')
    $sql$;
    EXECUTE $sql$
      UPDATE "Lesson"
      SET "videoProvider" = 'FILE', "videoSrc" = "videoUrl"
      WHERE ("youtubeId" IS NULL OR TRIM("youtubeId") = '')
        AND "videoUrl" IS NOT NULL
        AND TRIM("videoUrl") <> ''
        AND "videoUrl" NOT ILIKE '%vimeo.com%'
        AND ("videoSrc" IS NULL OR "videoSrc" = '')
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerYoutubeId'
  ) THEN
    EXECUTE $sql$
      UPDATE "Course"
      SET "trailerProvider" = 'YOUTUBE', "trailerSrc" = "trailerYoutubeId"
      WHERE "trailerYoutubeId" IS NOT NULL
        AND TRIM("trailerYoutubeId") <> ''
        AND ("trailerSrc" IS NULL OR "trailerSrc" = '')
    $sql$;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerVideoUrl'
  ) THEN
    EXECUTE $sql$
      UPDATE "Course"
      SET "trailerProvider" = 'FILE', "trailerSrc" = "trailerVideoUrl"
      WHERE ("trailerYoutubeId" IS NULL OR TRIM("trailerYoutubeId") = '')
        AND "trailerVideoUrl" IS NOT NULL
        AND TRIM("trailerVideoUrl") <> ''
        AND ("trailerSrc" IS NULL OR "trailerSrc" = '')
    $sql$;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'youtubeId'
  ) THEN
    ALTER TABLE "Lesson" DROP COLUMN "youtubeId";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Lesson' AND column_name = 'videoUrl'
  ) THEN
    ALTER TABLE "Lesson" DROP COLUMN "videoUrl";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerYoutubeId'
  ) THEN
    ALTER TABLE "Course" DROP COLUMN "trailerYoutubeId";
  END IF;
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'Course' AND column_name = 'trailerVideoUrl'
  ) THEN
    ALTER TABLE "Course" DROP COLUMN "trailerVideoUrl";
  END IF;
END $$;
