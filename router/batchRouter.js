const express = require('express')
const Joi = require('joi')
const Batch = require('../model/Batch')
const User = require('../model/User')
const { startSession } = require('mongoose')
const { authMiddleware, checkSuperAdmin, checkAdmin } = require('../middleware/authMiddleware');
const router = express.Router()

//Joi schema for batch
const batchSchema = Joi.object({
    name: Joi.string().required(),
    level_id: Joi.string().required(),
    institute_id: Joi.string().required()
})

//Add batch
router.post('/add', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const { error } = batchSchema.validate(req.body)
        if (error) {
            return res.status(400).send({ msg: "Validation errors", errors: error.details.map(detail => detail.message) });
        }
        const { name, level_id, institute_id } = req.body
        const existingBatch = await Batch.findOne({ name, level_id, institute_id })
        if (existingBatch) {
            return res.status(409).send({ msg: "Batch already exists...!" })
        }

        const newBatch = new Batch({
            name,
            level_id,
            institute_id
        })
        await newBatch.save()
        res.status(200).send({ msg: "Batch created successfully...!", batch: newBatch })
    } catch (err) {
        res.status(500).send({ msg: "Adding batch failed", error: err.message })
    }
})

//Get all batchs
router.get('/', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const allBatches = await Batch.find()
        res.status(200).send(allBatches)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching batches data", error: err.message })
    }
})

//Get single batch
router.get('/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const batch_id = req.params.id
        const batchData = await Batch.findById(batch_id)
        if (!batchData) {
            return res.status(400).send({ msg: "Batch not found with this id" })
        }
        res.status(200).send(batchData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching batch data", error: err.message })
    }
})

//Joi schema for batch
const updateBatchSchema = Joi.object({
    name: Joi.string().required(),
    level_id: Joi.string().required(),
    institute_id: Joi.string().required()
}).min(1)
//Update batch data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const batch_id = req.params.id
        const { error: updateError } = updateBatchSchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateBatchData = await Batch.findByIdAndUpdate(batch_id, req.body, { new: true })
        if (!updateBatchData) {
            return res.status(400).send({ msg: "Batch not found with this id" })
        }
        res.status(200).send({ msg: "Batch data updated successfully...!", updatedBatch: updateBatchData })
    } catch (err) {
        res.status(500).send({ msg: "Error updating batch data", error: err.message })
    }
})

//Delete batch
router.delete('/del/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {

        const session = await startSession()
        session.startTransaction()

        const batch_id = req.params.id
        const deleteBatch = await Batch.findByIdAndDelete(batch_id)
        if (!deleteBatch) {
            return res.status(400).send({ msg: "Batch not found with this id" })
        }

        const students = await User.find({ batch_id }, { _id: 1 }).session(session)
        const studentIds = await students.map(student => student._id)

        if (studentIds.length === 0) {
            await Batch.findByIdAndDelete(batch_id).session(session)
        } else {
            await User.deleteMany({ _id: { $in: studentIds } }).session(session)

            await Batch.findByIdAndDelete(batch_id).session(session)
        }

        await session.commitTransaction()
        session.endSession()

        res.status(200).send({ msg: "Batch data deleted successfully...!", deletedBatch: deleteBatch })
    } catch (err) {
        await session.abortTransaction()
        session.endSession()
        res.status(500).send({ msg: "Error deleting batch", error: err.message })
    }
})

module.exports = router