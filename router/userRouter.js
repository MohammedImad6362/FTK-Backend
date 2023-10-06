const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const Joi = require("joi"); // Import Joi for validation
const User = require("../model/User");
const { startSession } = require('mongoose')
const {
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

// Function to generate an access token
function generateToken(userId, role) {
     const secretKey = process.env.SECRET_KEY;
     const expiresIn = "6h"; // Token expiration time

     const accessToken = jwt.sign({ userId, role }, secretKey, { expiresIn });
     return accessToken;
}

// Function to generate a refresh token
function generateRefreshToken(userId, role) {
     const secretKey = process.env.SECRET_KEY; // Use a different secret for refresh tokens
     const expiresIn = "30d"; // Refresh token expiration time (e.g., 30 days)

     // You can include the user ID or any other unique identifier in the refresh token payload
     const refreshTokenPayload = {
          userId,
          role,
     };

     const refreshToken = jwt.sign(refreshTokenPayload, secretKey, { expiresIn });
     return refreshToken;
}
// Auto generating token route
router.get("/gen-token", async (req, res) => {
     try {
          // Generate a JWT token for the newly registered admin
          const token = generateToken({
               userId: superAdmin._id,
               role: superAdmin.role,
          });
          console.log(token);
          res.cookie("accessToken", token, {
               httpOnly: true,
               maxAge: 1 * 24 * 60 * 60 * 1000,
          });

          // Generate a refresh token
          const refreshToken = generateRefreshToken({
               userId: superAdmin._id,
               role: superAdmin.role,
          });
          console.log(refreshToken);

          // Set the refresh token as a HTTP-only cookie in the response
          res.cookie("refreshToken", refreshToken, {
               httpOnly: true,
               maxAge: 30 * 24 * 60 * 60 * 1000,
          }); // Expiry time: 30 days

          res
               .status(201)
               .send({ msg: "Token generated successfully...!", generatedToken: token });
     } catch (err) {
          res
               .status(500)
               .send({ msg: "Token generating failed", error: err.message });
     }
});

// ---------------------------------SUPERADMIN-------------------------------------------
// Joi schema for SuperAdmin
const superAdminSchema = Joi.object({
     email: Joi.string().email().required(),
     password: Joi.string().min(6).required(),
     role: Joi.string().valid("SUPERADMIN").required(),
});
// Registering SuperAdmin
router.post("/superadmin", async (req, res) => {
     try {
          const { error } = superAdminSchema.validate(req.body);
          if (error) {
               return res.status(400).send({
                    msg: "Validation errors",
                    errors: error.details.map((detail) => detail.message),
               });
          }
          const { email, password, role } = req.body;

          const existingSuperAdmin = await User.findOne({ role });
          if (existingSuperAdmin) {
               return res
                    .status(409)
                    .send({ msg: "Can't create more than one SuperAdmin...!" });
          }

          // Create a doc for admin
          const superAdmin = new User({
               email,
               password,
               role,
          });

          // Save doc
          await superAdmin.save();

          // Generate a JWT token for the newly registered admin
          const token = generateToken({
               userId: superAdmin._id,
               role: superAdmin.role,
          });
          console.log(token);

          // Generate a refresh token
          const refreshToken = generateRefreshToken({
               userId: superAdmin._id,
               role: superAdmin.role,
          });
          console.log(refreshToken);

          // Set the refresh token as a HTTP-only cookie in the response
          res.cookie("refreshToken", refreshToken, {
               httpOnly: true,
               maxAge: 30 * 24 * 60 * 60 * 1000,
          }); // Expiry time: 30 days

          console.log(superAdmin._id);
          res.status(201).send({
               msg: "SuperAdmin registered successfully...!",
               superAdmin: superAdmin,
               token,
          });
     } catch (err) {
          res
               .status(500)
               .send({ msg: "SuperAdmin registration failed", error: err.message });
     }
});

/* --------------------------ADMIN--------------------------- */
// Joi schema for Admin
const adminSchema = Joi.object({
     name: Joi.string().required(),
     email: Joi.string().email().required(),
     password: Joi.string().min(6).required(),
     role: Joi.string().valid("ADMIN").required(),
     institute_id: Joi.string().required(),
});

// Registering Admin
router.post("/reg-admin", authMiddleware, checkSuperAdmin, async (req, res) => {
     try {
          const { error } = adminSchema.validate(req.body);
          if (error) {
               return res.status(400).send({
                    msg: "Validation errors",
                    errors: error.details.map((detail) => detail.message),
               });
          }

          const { name, email, password, role, institute_id } = req.body;

          // Hash the password using bcrypt
          const hashedPassword = await bcrypt.hash(password, 10);

          const existingAdmin = await User.findOne({ email });
          if (existingAdmin) {
               return res
                    .status(409)
                    .send({ msg: "Admin with this email already exists...!" });
          }

          // Create a doc for admin
          const newAdmin = new User({
               name,
               email,
               password: hashedPassword,
               role,
               institute_id,
          });

          // Save doc
          await newAdmin.save();

          // Generate a JWT token for the newly registered admin
          const token = generateToken({ userId: newAdmin._id, role: newAdmin.role });
          console.log(token);

          // Generate a refresh token
          const refreshToken = generateRefreshToken({
               userId: newAdmin._id,
               role: newAdmin.role,
          });
          console.log(refreshToken);

          // Set the refresh token as a HTTP-only cookie in the response
          res.cookie("refreshToken", refreshToken, {
               httpOnly: true,
               maxAge: 30 * 24 * 60 * 60 * 1000,
          }); // Expiry time: 30 days

          console.log(newAdmin._id);
          res.status(201).send({
               msg: "Admin registered successfully...!",
               registeredAdmin: newAdmin,
               token,
          });
     } catch (err) {
          res
               .status(500)
               .send({ msg: "Admin registration failed", error: err.message });
     }
});

// Login admin
router.post(
     "/login-admin",
     authMiddleware,
     checkSuperAdmin,
     async (req, res) => {
          try {
               const loginData = req.body;
               const { error } = Joi.object({
                    email: Joi.string().email().required(),
                    password: Joi.string().required(),
               }).validate(loginData);

               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }

               const { email, password } = loginData;

               // Find the admin with the provided email
               const admin = await User.findOne({ email });

               // Check if the admin exists
               if (!admin) {
                    return res.status(401).send({ msg: "Invalid credentials...!E" });
               }

               // Compare the provided password with the hashed password in the database
               const passwordMatch = await bcrypt.compare(password, admin.password);

               // If passwords do not match, return an error
               if (!passwordMatch) {
                    return res.status(401).send({ msg: "Invalid credentials...!P" });
               }

               // Generate a JWT token for the authenticated admin
               const token = generateToken({ userId: admin._id, role: admin.role });

               // Generate a refresh token
               const refreshToken = generateRefreshToken();

               // Set the refresh token as a HTTP-only cookie in the response
               res.cookie("refreshToken", refreshToken, {
                    httpOnly: true,
                    maxAge: 30 * 24 * 60 * 60 * 1000,
               }); // Expiry time: 30 days

               // Send the token in the response along with any additional data if needed
               res.status(200).send({ msg: "Admin login successful.", token });
          } catch (err) {
               res.status(500).send({ msg: "Admin login failed", error: err.message });
          }
     }
);

//Get all admins
router.get(
     "/admins",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const allAdmins = await User.find({ role: "ADMIN" });
               res.status(200).send(allAdmins);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching admins data", error: err.message });
          }
     }
);

// Get single admin - Accessible only to SUPERADMIN
router.get(
     "/admin/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const admin_id = req.params.id;
               const { error } = adminSchema.validate(admin_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const adminData = await User.findById(admin_id);
               if (!adminData) {
                    return res.status(400).send({ msg: "Admin not found with this id" });
               }
               res.status(200).send(adminData);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching admin's data", error: err.message });
          }
     }
);

// Joi schema for update admin data
const updateAdminSchema = Joi.object({
     name: Joi.string().required(),
     email: Joi.string().email().required(),
     password: Joi.string().min(6).required(),
     role: Joi.string().valid("ADMIN").required(),
     institute_id: Joi.string().required(),
}).min(1); // Require at least one field to be present for update

// Update admin data - Accessible only to SUPERADMIN
router.patch(
     "/upd-admin/:id",
     authMiddleware,
     checkSuperAdmin,
     async (req, res) => {
          try {
               const admin_id = req.params.id;
               const { error: updateError } = updateAdminSchema.validate(req.body);
               if (updateError) {
                    res.status(400).send({
                         msg: "Update validation error",
                         errors: updateError.details.map((detail) => detail.message),
                    });
               }
               const { error } = adminSchema.validate(admin_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const updateAdminData = await User.findByIdAndUpdate(admin_id, req.body, {
                    new: true,
               });
               if (!updateAdminData) {
                    res.status(400).send({ msg: "No admin found with this id" });
               }
               res.status(200).send({
                    msg: "Admin data updated successfully...!",
                    updatedAdmin: updateAdminData,
               });
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error updating admin data", error: err.message });
          }
     }
);

// Delete admin - Accessible only to SUPERADMIN
router.delete(
     "/del-admin/:id",
     authMiddleware,
     checkSuperAdmin,
     async (req, res) => {
          try {
               const admin_id = req.params.id;
               const { error } = adminSchema.validate(admin_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const deleteAdmin = await User.findByIdAndDelete(admin_id);
               if (!deleteAdmin) {
                    res.status(400).send({ msg: "No admin found with this id" });
               }
               res.status(200).send({
                    msg: "Admin deleted successfully...!",
                    deletedAdmin: deleteAdmin,
               });
          } catch (err) {
               res.status(500).send({ msg: "Error deleting admin", error: err.message });
          }
     }
);

/*--------------------------------STUDENT-------------------------------- */
// Joi schema for Student
const studentSchema = Joi.object({
     name: Joi.string().required(),
     role: Joi.string().valid("STUDENT").required(),
     parent_id: Joi.string().required(),
     batch_id: Joi.string().required(),
     branch_id: Joi.string().required(),
     institute_id: Joi.string().required(),
});

//Adding student
router.post(
     "/add-student",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const { error } = studentSchema.validate(req.body);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }

               const { name, role, parent_id, batch_id, branch_id, institute_id } = req.body;

               const newStudent = new User({
                    name,
                    role,
                    parent_id,
                    batch_id,
                    branch_id,
                    institute_id,
               });

               await newStudent.save();
               res.status(201).send({
                    msg: "Student added successfully...!",
                    addedStudent: newStudent,
               });
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Adding student failed", error: err.message });
          }
     }
);

//Get all students
router.get(
     "/students",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const allStudents = await User.find({ role: "STUDENT" });
               res.status(200).send(allStudents);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching students data", error: err.message });
          }
     }
);

//Get single student
router.get(
     "/student/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const student_id = req.params.id;
               const { error } = studentSchema.validate(student_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const studentData = await User.findById(student_id);
               console.log(studentData);
               if (!studentData) {
                    return res.status(400).send({ msg: "Student not found with this id" });
               }
               res.status(200).send(studentData);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching student's data", error: err.msg });
          }
     }
);

// Joi schema for update Student data
const updateStudentSchema = Joi.object({
     name: Joi.string().required(),
     role: Joi.string().valid("STUDENT").required(),
     parent_id_id: Joi.string().required(),
     batch_id: Joi.string().required(),
     branch_id: Joi.string().required(),
     institute_id: Joi.string().required(),
     points: Joi.array().items(
          Joi.object({
               category_id: Joi.string().required(),
               activities: Joi.array().items(
                    Joi.object({
                         activity_id: Joi.string().required(),
                         point: Joi.number(),
                    })
               ),
          })
     ),
}).min(1);
//Update student data
router.patch(
     "/upd-student/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const student_id = req.params.id;
               const { error: updateError } = updateStudentSchema.validate(req.body);
               if (updateError) {
                    res.status(400).send({
                         msg: "Update validation error",
                         errors: updateError.details.map((detail) => detail.message),
                    });
               }
               const { error } = studentSchema.validate(student_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const updateStudentData = await User.findByIdAndUpdate(
                    student_id,
                    req.body,
                    { new: true }
               );
               if (!updateStudentData) {
                    res.status(400).send({ msg: "No student found with this id" });
               }
               res.status(200).send({
                    msg: "Student data updated successfully...!",
                    updatedStudent: updateStudentData,
               });
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error updating student data", error: err.msg });
          }
     }
);

//Delete student
router.delete(
     "/del-student/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const student_id = req.params.id;
               const { error } = studentSchema.validate(student_id);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }
               const deleteStudent = await User.findByIdAndDelete(student_id);
               if (!deleteStudent) {
                    res.status(400).send({ msg: "No student found with this id" });
               }
               res.status(200).send({
                    msg: "Student deleted successfully...!",
                    deletedStudent: deleteStudent,
               });
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error deleting student", error: err.message });
          }
     }
);

/*---------------------------------------PARENT----------------------------------------- */
// Joi schema for Parent
const parentSchema = Joi.object({
     name: Joi.string().required(),
     mobile: Joi.string().required(),
     role: Joi.string().valid("PARENT").required(),
     institute_id: Joi.string().required(),
});

//Adding parent
router.post(
     "/add-parent",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const { error } = parentSchema.validate(req.body);
               if (error) {
                    return res.status(400).send({
                         msg: "Validation errors",
                         errors: error.details.map((detail) => detail.message),
                    });
               }

               const { name, mobile, role, institute_id } = req.body;

               const existingParent = await User.findOne({ mobile });
               if (existingParent) {
                    return res
                         .status(409)
                         .send({ msg: "Parent with this mobile already exists...!" });
               }

               const newParent = new User({
                    name,
                    mobile,
                    role,
                    institute_id,
               });

               await newParent.save();

               res
                    .status(201)
                    .send({ msg: "Parent added successfully...!", addedParent: newParent });
          } catch (err) {
               res.status(500).send({ msg: "Adding parent failed", error: err.message });
          }
     }
);

//Get all parents
router.get(
     "/parents",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const allParents = await User.find({ role: "PARENT" });
               res.status(200).send(allParents);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching parents data", error: err.message });
          }
     }
);

//Get single parent
router.get(
     "/parent/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const parent_id = req.params.id;
               const parentData = await User.findById(parent_id);
               console.log(parentData);
               if (!parentData) {
                    return res.status(400).send({ msg: "Parent not found with this id" });
               }
               res.status(200).send(parentData);
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error fetching parent's data", error: err.msg });
          }
     }
);

// Joi schema for update Parent data
const updateParentSchema = Joi.object({
     name: Joi.string().required(),
     mobile: Joi.string().required(),
     role: Joi.string().valid("PARENT").required(),
     institute_id: Joi.string().required(),
}).min(1);

//Update parent data
router.patch(
     "/upd-parent/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {
               const parent_id = req.params.id;
               const { error: updateError } = updateParentSchema.validate(req.body);
               if (updateError) {
                    res.status(400).send({
                         msg: "Update validation error",
                         errors: updateError.details.map((detail) => detail.message),
                    });
               }
               const updateParentData = await User.findByIdAndUpdate(
                    parent_id,
                    req.body,
                    { new: true }
               );
               if (!updateParentData) {
                    res.status(400).send({ msg: "No parent found with this id" });
               }
               res.status(200).send({
                    msg: "Parent data updated successfully...!",
                    updatedParent: updateParentData,
               });
          } catch (err) {
               res
                    .status(500)
                    .send({ msg: "Error updating parent data", error: err.msg });
          }
     }
);

//Delete parent
router.delete(
     "/del-parent/:id",
     authMiddleware,
     checkSuperAdmin,
     checkAdmin,
     async (req, res) => {
          try {

               const session = await startSession()
               session.startTransaction()

               const parent_id = req.params.id;
               const deleteParent = await User.findByIdAndDelete(parent_id);
               if (!deleteParent) {
                    res.status(400).send({ msg: "No parent found with this id" });
               }
               // Find all students associated with this level
               const students = await User.find({ parent_id }, { _id: 1 }).session(session);
               console.log(students)
               const studentIds = students.map(student => student._id);

               if (studentIds.length === 0) {
                    await User.findByIdAndDelete(parent_id).session(session);
               } else {
                    await User.deleteMany({ _id: { $in: studentIds } }).session(session);

                    await User.findByIdAndDelete(parent_id).session(session);
               }

               await session.commitTransaction();
               session.endSession();

               res.status(200).send({
                    msg: "Parent deleted successfully...!",
                    deletedParent: deleteParent,
               });
          } catch (err) {
               await session.abortTransaction();
               session.endSession();
               res
                    .status(500)
                    .send({ msg: "Error deleting parent", error: err.message });
          }
     }
);

//---------------------------------Testing Authorization------------------------------
// Example route with authentication and superadmin authorization
router.get("/superadmin-only", authMiddleware, checkSuperAdmin, (req, res) => {
     // Accessing the user role from req.userRole
     const userRole = req.userRole;
     // This route is accessible only to SuperAdmins
     res.send({
          msg: `Welcome, ${userRole}! You have access to the SuperAdmin-only route.`,
     });
});

// Example route with authentication and admin authorization
router.get("/admin-only", authMiddleware, checkAdmin, (req, res) => {
     // Accessing the user role from req.userRole
     const userRole = req.userRole;
     // This route is accessible only to Admins
     res.send({
          msg: `Welcome, ${userRole}! You have access to the Admin-only route.`,
     });
});

module.exports = router;
