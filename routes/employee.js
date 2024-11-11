const express = require('express');
const Employee = require('../models/Employee');
const router = express.Router();
const upload = require('../uploadMiddleware');
const fs = require('fs');
const path = require('path');

// Get all employees
router.get('/', async (req, res) => {
  try {
    const employees = await Employee.find();
    res.json(employees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get employee by ID
router.get('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Create employee with image upload and auto-increment ID
router.post('/', upload.single('f_Image'), async (req, res) => {
  try {
    // Count existing employees
    const employeeCount = await Employee.countDocuments();

    // Prepare new employee data
    const employeeData = {
      ...req.body,
      f_Id: employeeCount + 1, // Increment ID based on count
      f_Image: req.file ? `/uploads/${req.file.filename}` : '',
    };

    const newEmployee = new Employee(employeeData);
    const employee = await newEmployee.save();
    res.json(employee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update employee with image upload
router.put('/:id', upload.single('f_Image'), async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Prepare update data
    const updateData = { ...req.body };

    // Handle image update
    if (req.file) {
      // If there's a new file, delete the old one
      if (employee.f_Image) {
        const oldPath = path.join(__dirname, '..', employee.f_Image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      // Set new image path
      updateData.f_Image = `/uploads/${req.file.filename}`;
    } else if (req.body.existingImage) {
      // If no new file but existing image path provided, keep the old path
      updateData.f_Image = req.body.existingImage;
    }

    // Remove existingImage from updateData as it's not a field in our model
    delete updateData.existingImage;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updatedEmployee);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});


// Delete employee

router.delete('/:id', async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Delete the associated image if it exists
    if (employee.f_Image) {
      const imagePath = path.join(__dirname, '..', employee.f_Image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Employee.findByIdAndDelete(req.params.id);

    // Get updated counts after deletion
    const totalCount = await Employee.countDocuments();
    const activeCount = await Employee.countDocuments({ isActive: true });

    res.json({ 
      message: 'Employee removed successfully',
      counts: {
        total: totalCount,
        active: activeCount
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Toggle employee active status
router.patch('/:id/toggle-status', async (req, res) => {
  try {
    const { isActive } = req.body;

    const updatedEmployee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update counts
    const totalCount = await Employee.countDocuments();
    const activeCount = await Employee.countDocuments({ isActive: true });

    res.json({
      employee: updatedEmployee,
      counts: { total: totalCount, active: activeCount },
    });
  } catch (err) {
    console.error('Error updating employee status:', err);
    res.status(500).send('Server error');
  }
});

module.exports = router;
