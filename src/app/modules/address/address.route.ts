import express from "express";
import { AddressController } from "./address.controller";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
const router = express.Router();
router.post("/", AddressController.createAddress).get("/", AddressController.getAllAddress);
router.post("/single", AddressController.saveSingleAddress);
router.post("/sheet", fileUploadHandler(), AddressController.saveSheetAddress);
router.get("/search", AddressController.searchPlaces);

router.route("/:id").patch(AddressController.updateAddress).delete(AddressController.deleteAddress);
export const AddressRoutes = router;