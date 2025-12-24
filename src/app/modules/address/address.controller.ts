import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { AddressService } from "./address.service";
import sendResponse from "../../../shared/sendResponse";
import { getSingleFilePath } from "../../../shared/getFilePath";
import { kafkaProducer } from "../../../handlers/kafka.producer";
import { Address } from "./address.model";
import ApiError from "../../../errors/ApiError";
import { StatusCodes } from "http-status-codes";
import { Types } from "mongoose";

const createAddress = catchAsync(async (req:Request,res:Response) => {
    await kafkaProducer.sendMessage('address', req.body?.address);
    // const createdAddress = await AddressService.createAddressIntoDB(req.body?.address);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        statusCode: 200,
    });
})

const saveSingleAddress = catchAsync(async (req:Request,res:Response) => {
      const isExist = await Address.findOne({ name: req.body.name });
      if (isExist){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Address already exist');
      }
    await kafkaProducer.sendMessage('singleAddress', req.body);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        statusCode: 200,
    });
})

const saveSheetAddress = catchAsync(async (req:Request,res:Response) => {
    const doc = getSingleFilePath(req.files, 'doc');
    await kafkaProducer.sendMessage('csv-handle', doc);
    sendResponse(res, {
        success: true,
        message: "Address created successfully",
        data: doc,
        statusCode: 200,
    });
})

const searchPlaces = catchAsync(async (req:Request,res:Response) => {
   
    
    const createdAddress = await AddressService.searchByLatlong({latitude: req.query.latitude ,longitude: req.query.longitude } as any,req.query.radius as string,req.query.lang as string,req.query.type as string[]);
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

const searchAddress = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.searchAddress(req.query);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress?.data,
        statusCode: 200,
    });
})


const getSingleAddress = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.singleAaddressFromDB(req.params.id,req.query.lang as string);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const deleteBulkAddress = catchAsync(async (req:Request,res:Response) => {
    if(!req.body?.ids?.length){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'ids is required');
    }
    const createdAddress = await AddressService.addressBulkDelete(req.body?.ids);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const singleTextTranslate = catchAsync(async (req:Request,res:Response) => {
    const createdAddress = await AddressService.translateSingleText(req.body?.text);
    sendResponse(res, {
        success: true,
        message: "Address deleted successfully",
        data: createdAddress,
        statusCode: 200,
    });
})

const getWebdetailsOfAddress = catchAsync(async (req:Request,res:Response) => {
    if(!req.params.id){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'id is required');
    }
    if(!(new Types.ObjectId(req.params.id))){
        throw new ApiError(StatusCodes.BAD_REQUEST, 'id is invalid');
    }
    const createdAddress = await AddressService.getWebdetailsOfAddress(req.params.id,req.query.lang as string);
    sendResponse(res, {
        success: true,
        message: "web details get successfully",
        data: createdAddress,
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
    getAllAddress,
    searchAddress,
    getSingleAddress,
    deleteBulkAddress,
    singleTextTranslate,
    getWebdetailsOfAddress
}