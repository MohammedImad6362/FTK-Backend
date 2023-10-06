const express = require('express')
const Joi = require('joi')
const Video = require('../model/Video')
const { authMiddleware,  checkSuperAdmin, checkAdmin } = require('../middleware/authMiddleware');
const router = express.Router()

//Joi schema for video
const videoSchema = Joi.object({
    url: Joi.string().required(),
    category_id: Joi.string().required(),
    desription: Joi.string().required()
})

//Add video
router.post('/add', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const { error } = videoSchema.validate(req.body)
        if (error) {
            res.status(400).send({ msg: "Validation error", errors: error.details.map(detail => detail.message) })
        }
        const { url, category_id, description } = req.body
        const existingVideo = await Video.findOne({ url, category_id })
        if (existingVideo) {
            return res.status(409).send({ msg: "Video already exists...!" })
        }
        const newVideo = new Video({
            url,
            category_id,
            description
        })
        await newVideo.save()
        res.status(200).send({ msg: "Video created successfully...!", video: newVideo })
    } catch (err) {
        res.status(500).send({ msg: "Adding video failed", error: err.message })
    }
})

//Get all videos
router.get('/', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const allVideosDetails = await Video.find()
        res.status(200).send(allVideosDetails)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching videoes data", error: err.message })
    }
})

//Get single video
router.get('/:id', authMiddleware, checkSuperAdmin, checkAdmin, async (req, res) => {
    try {
        const video_id = req.params.id
        const videoDetails = await Video.findById(video_id)
        if (!videoDetails) {
            return res.status(400).send({ msg: "Video not found with this id" })
        }
        res.status(200).send(videoDetails)
    } catch (err) {
        res.status(500).send({ msg: "Error fetching video data", error: err.message })
    }
})

// Joi schema for update video data
const updateVideoSchema = Joi.object({
    url: Joi.string(),
    category_id: Joi.string(),
    description: Joi.string(),
}).min(1); // Require at least one field to be present for update
//Update video data
router.patch('/upd/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const video_id = req.params.id
        const { error: updateError } = updateVideoSchema.validate(req.body)
        if (updateError) {
            res.status(400).send({ msg: "Update validation error", errors: updateError.details.map(detail => detail.message) })
        }
        const updateVideoDetails = await Video.findByIdAndUpdate(video_id, req.body, { new: true })
        if (!updateVideoDetails) {
            return res.status(400).send({ msg: "Video not found with this id" })
        }
        res.status(200).send({ msg: "Video data updated successfully...!", updatedVideo: updateVideoDetails })
    } catch (err) {
        res.status(500).send({ msg: "Error updating video data", error: err.message })
    }
})

//Delete video
router.delete('/del/:id', authMiddleware, checkSuperAdmin, async (req, res) => {
    try {
        const video_id = req.params.id
        const deleteVideo = await Video.findByIdAndDelete(video_id)
        if (!deleteVideo) {
            return res.status(400).send({ msg: "Video not found with this id" })
        }
        res.status(200).send({ msg: "Video data deleted successfully...!", deletedVideo: deleteVideo })
    } catch (err) {
        res.status(500).send({ msg: "Error deleting video", error: err.message })
    }
})

module.exports = router