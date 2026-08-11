"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const settings_controller_1 = require("../controllers/settings.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// GET is public so checkout can access it
router.get('/', settings_controller_1.getSettings);
// PATCH requires admin auth
router.patch('/', auth_middleware_1.verifyToken, settings_controller_1.updateSettings);
exports.default = router;
