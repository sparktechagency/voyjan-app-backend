import express from "express";
import { AddressController } from "./address.controller";
import fileUploadHandler from "../../middlewares/fileUploadHandler";
const router = express.Router();
router.post("/", AddressController.createAddress).get("/", AddressController.getAllAddress);
router.post("/single", AddressController.saveSingleAddress);
router.post("/sheet", fileUploadHandler(), AddressController.saveSheetAddress);
router.get("/search-address", AddressController.searchAddress);
router.get("/search", AddressController.searchPlaces);
router.delete("/bulk-delete", AddressController.deleteBulkAddress);

router.route("/:id").patch(AddressController.updateAddress).delete(AddressController.deleteAddress).get(AddressController.getSingleAddress);
export const AddressRoutes = router;