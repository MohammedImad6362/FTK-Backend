const express = require('express');
const Institute = require('../model/Institute');
const User = require('../model/User');
const Batch = require('../model/Batch')
const Branch = require('../model/Branch')
const { startSession } = require('mongoose')
const Joi = require('joi'); // Import Joi for validation
const { authMiddleware, checkSuperAdmin } = require('../middleware/authMiddleware');
const router = express.Router();

// Joi schema for Institute
const instituteSchema = Joi.object({
    name: Joi.string().required(),
    subscription_type: Joi.string().valid('FREE', 'PAID').required(),
    subscription_expiry: Joi.date().when('subscription_type', {
        is: 'PAID',
        then: Joi.date().required(),
        otherwise: Joi.date().optional()
    })
});
// Adding institute
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = instituteSchema.validate(req.body);
        if (error) {
            return res.status(400).send({ msg: "Validation errors", errors: error.details.map(detail => detail.message) });
        }

        const { name, subscription_type, subscription_expiry } = req.body

        const existingInstitute = await Institute.findOne({ name })
        if (existingInstitute) {
            return res.status(409).send({ msg: "Institute with this name already exists" });
        }

        //Add a new institute document
        const newInstitute = new Institute({
            name,
            subscription_type,
            subscription_expiry
        })

        //save the new institute to the DB
        const saveInstitute = await newInstitute.save()
        console.log(saveInstitute)

        res.status(201).send({ msg: "Institute added succesfully...!", institute: newInstitute })
        console.log("success")
    } catch (err) {
        res.status(500).send({ msg: "Adding institute failed...!", error: err.message })
    }
})

//Get all institutes
router.get('/', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const institutesData = await Institute.find()
        res.status(200).send(institutesData)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching institutes data", error: err.message })
    }
})

//Get single institute
router.get('/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const inst_ID = req.params.id
        const instituteData = await Institute.findById(inst_ID)

        if (!instituteData) {
            return res.status(400).send({ msg: "No Institute found for the given ID" });
        }
        res.status(200).send(instituteData);
    } catch (err) {
        res.status(500).send({ msg: "Error fetching institute data", error: err.message })
    }
})

// Joi schema for update Institute data
const updateInstituteSchema = Joi.object({
    name: Joi.string().required(),
    subscription_type: Joi.string().valid('FREE', 'PAID').required(),
    subscription_expiry: Joi.date().when('subscription_type', {
        is: 'PAID',
        then: Joi.date().required(),
        otherwise: Joi.date().optional()
    }),
    activity_privileges: Joi.array().items(
        Joi.object({
            level_id: Joi.string().required(),
            categories: Joi.array().items(
                Joi.object({
                    branch_id: Joi.string().required(),
                    activity_id: Joi.array().items(Joi.object({}))
                })
            )
        })
    )
}).min(1);
//Update institute data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const inst_ID = req.params.id
        const { error: updateError } = updateInstituteSchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateInstituteData = await Institute.findByIdAndUpdate(inst_ID, req.body, { new: true })
        if (!updateInstituteData) {
            res.status(400).send({ msg: "Institute not found with this id" })
        }
        res.status(200).send({ msg: "Institute data updated successfully...!", updatedUser: updateInstituteData })
    } catch (err) {
        res.status(500).send({ msg: "Error updating institute data", error: err.message })
    }
})

//Delete institute
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {

        const session = await startSession()
        session.startTransaction()

        const inst_ID = req.params.id
        const deleteInstitute = await Institute.findByIdAndDelete(inst_ID)
        if (!deleteInstitute) {
            res.status(400).send({ msg: "Institute not found with this id" })
        }

        const branches = await Branch.find({ inst_ID }, { _id: 1 }).session(session);
        const branchIds = branches.map(branch => branch._id);

        if (branchIds.length === 0) {
            // If branches are empty, delete the institute and related collections
            await Institute.findByIdAndDelete(inst_ID).session(session);
        } else {
            // Find all users associated with the institute
            await User.deleteMany({ institute_id: { $in: branchIds } }).session(session);

            // Find all batches associated with the institute
            await Batch.deleteMany({ batch_id: { $in: branchIds } }).session(session);

            // Delete all Branches associated with the institute
            await Branch.deleteMany({ inst_ID }).session(session);

            // Finally, delete the level itself
            await Institute.findByIdAndDelete(inst_ID).session(session);
        }
        await session.commitTransaction();
        session.endSession();

        res.status(200).send({ msg: "Institute deleted successfully...!", deletedUser: deleteInstitute })
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).send({ msg: "Error deleting institute", error: err.message })
    }
})

module.exports = router