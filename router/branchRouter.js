const express = require('express')
const Joi = require('joi')
const Branch = require('../model/Branch')
const Batch = require('../model/Batch')
const User = require('../model/User')
const { startSession } = require('mongoose')
const { authMiddleware, checkSuperAdmin } = require('../middleware/authMiddleware');
const router = express.Router()

//Joi schema for branch
const branchSchema = Joi.object({
    name: Joi.string().required(),
    institute_id: Joi.string().required()
})

//Add branch
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = branchSchema.validate(req.body)
        if (error) {
            return res.status(400).send({ msg: "Validation errors", errors: error.details.map(detail => detail.message) });
        }
        const { name, institute_id } = req.body
        const existingBranch = await Branch.findOne({ name, institute_id })
        if (existingBranch) {
            return res.status(409).send({ msg: "Branch already exists...!" })
        }

        const newBranch = new Branch({
            name,
            institute_id
        })
        await newBranch.save()
        res.status(200).send({ msg: "Branch created successfully...!", branch: newBranch })
    } catch (err) {
        res.status(500).send({ msg: "Adding branch failed", error: err.message })
    }
})

//Get all branches
router.get('/', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const allBranches = await Branch.find()
        res.status(200).send(allBranches)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching branches data", error: err.message })
    }
})

//Get single branch
router.get('/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const branch_id = req.params.id
        const branchData = await Branch.findById(branch_id)
        if (!branchData) {
            return res.status(400).send({ msg: "Branch not found with this id" })
        }
        res.status(200).send(branchData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching branch data", error: err.message })
    }
})

//Joi schema for branch
const updateBranchSchema = Joi.object({
    name: Joi.string().required(),
    institute_id: Joi.string().required()
}).min(1)
//Update branch data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const branch_id = req.params.id
        const { error: updateError } = updateBranchSchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateBranchData = await Branch.findByIdAndUpdate(branch_id, req.body, { new: true })
        if (!updateBranchData) {
            return res.status(400).send({ msg: "Branch not found with this id" })
        }
        res.status(200).send({ msg: "Branch data updated successfully...!", updatedBranch: updateBranchData })
    } catch (err) {
        res.status(500).send({ msg: "Error updating branch data", error: err.message })
    }

    
})

//Delete branch
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {

        const session = await startSession()
        session.startTransaction()

        const branch_id = req.params.id
        const deleteBranch = await Branch.findByIdAndDelete(branch_id)
        if (!deleteBranch) {
            return res.status(400).send({ msg: "Branch not found with this id" })
        }

        const batches = await Batch.find({ branch_id }, { _id: 1 }).session(session)
        const batchIds = await batches.map(batch => batch._id)

        if (batchIds.length === 0) {
            await Branch.findByIdAndDelete(branch_id).session(session)
        } else {
            await User.deleteMany({branch_id : {$in : batchIds}}).session(session)

            await Batch.deleteMany({_id : {$in : batchIds}}).session(session)

            await Branch.findByIdAndDelete(branch_id).session(session)
        }

        await session.commitTransaction()
        session.endSession()

        res.status(200).send({ msg: "Branch data deleted successfully...!", deletedBranch: deleteBranch })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        res.status(500).send({ msg: "Error deleting branch", error: err.message })
    }
})

module.exports = router