import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AddressService } from "./address.service";
import sendResponse from "../../../shared/sendResponse";
import { getSingleFilePath } from "../../../shared/getFilePath";

const createAddress = catchAsync(async (req:Request,res:Response) => {

    const createdAddress = await AddressService.createAddressIntoDB(req.body?.address);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const saveSingleAddress = catchAsync(async (req:Request,res:Response) => {

    const createdAddress = await AddressService.createAddressSingleIntoDB(req.body);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const saveSheetAddress = catchAsync(async (req:Request,res:Response) => {
    const doc = getSingleFilePath(req.files, 'doc');
    const createdAddress = await AddressService.addDataFromExcelSheet(doc!);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const searchPlaces = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.searchByLatlong(req.query.search as string,req.query.radius as string);
    sendResponse(res, {
        success: true,
        message: "Address fetch successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const updateAddress = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.updateAddress(req.params.id,req.body);
    sendResponse(res, {
        success: true,
        message: "Address updated successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const deleteAddress = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.deleteAddress(req.params.id);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const getAllAddress = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.getAllAddress(req.query);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress.address,
        pagination: createdAddress.pagination,
        statusCode: 200,
    });
})



export const AddressController = {
    createAddress,
    saveSingleAddress,
    saveSheetAddress,
    searchPlaces,
    updateAddress,
    deleteAddress,
    getAllAddress
}