import { Router } from "express";
import { authenticate } from "../../shared/middlewares/authMiddleware.js";
import { requireProjectAccess } from "../../shared/middlewares/projectMiddleware.js";
import { requireCommentInProject } from "../../shared/middlewares/commentMiddleware.js";
import {
    listComments,
    addComment,
    getComment,
    editComment,
    removeComment,
    countComments
} from "./commentController.js";

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(requireProjectAccess);

router.get("/", listComments);

router.post("/", addComment);

router.get("/count", countComments);

router.get("/:commentId", requireCommentInProject, getComment);

router.put("/:commentId", requireCommentInProject, editComment);

router.delete("/:commentId", requireCommentInProject, removeComment);

export default router;