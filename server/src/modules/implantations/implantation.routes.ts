import { Router } from "express";
import { asyncHandler } from "../../lib/async-handler";
import { implantationController } from "./implantation.controller";
import { reviewController } from "./review.controller";

export const implantationRoutes = Router();

implantationRoutes.post("/", asyncHandler(implantationController.create));
implantationRoutes.get("/", asyncHandler(implantationController.list));
// Precisa vir antes de "/:id" — senão o Express casaria "stats" como :id.
implantationRoutes.get("/stats", asyncHandler(implantationController.stats));
implantationRoutes.get("/:id", asyncHandler(implantationController.getById));
implantationRoutes.patch("/:id", asyncHandler(implantationController.update));
implantationRoutes.post(
  "/:id/cancel",
  asyncHandler(implantationController.cancel),
);
implantationRoutes.post("/:id/onboarding-token/rotate", asyncHandler(implantationController.rotateOnboardingToken));
implantationRoutes.post("/:id/onboarding/reopen", asyncHandler(implantationController.reopenOnboarding));
implantationRoutes.get("/:id/activity", asyncHandler(implantationController.activity));
implantationRoutes.get("/:id/contact-import", asyncHandler(implantationController.contactImport));
implantationRoutes.get("/:id/contact-import/download", asyncHandler(implantationController.downloadContactImport));

implantationRoutes.get("/:id/review", asyncHandler(reviewController.getReview));
implantationRoutes.patch(
  "/:id/review",
  asyncHandler(reviewController.updateResponses),
);
implantationRoutes.post("/:id/approve", asyncHandler(reviewController.approve));
