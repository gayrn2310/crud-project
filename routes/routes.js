const express = require("express");
const router = express.Router();
const User = require('../../crud-project/models/users');
const multer = require('multer');
const fs = require('fs');

//image upload
var storage = multer.diskStorage({
  destination: function(req, file, cb){
    cb(null, './uploads')
  }, 
  filename: function(req, file, cb) {
    cb(null, file.fieldname + "_" + Date.now() + "_" + file.originalname);
  }
});

var upload = multer({
  storage: storage,
}).single('image');

//insert user into database route
router.post('/add', upload, async (req, res) => {
  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: req.file ? req.file.path : null,
    });

    await user.save();
    req.session.message = {
      type: "success",
      message: "User added successfully",
    };
    res.redirect('/');
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

//Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().exec();
    res.render('index', {
      title: 'Home Page',
      users: users,
    });
  } catch (err) {
    res.json({ message: err.message });
  }
});

router.get('/add', (req, res) => {
  res.render('add_users', {title: 'Add Users'});
});

router.get('/edit/:id', async (req, res) => {
  try {
    let id = req.params.id;
    const user = await User.findById(id);

    if(user == null) {
      res.redirect('/');
    } else {
      res.render('edit_users', {title: 'Edit Users', user: user,});
    }
  } catch (err) {
    res.redirect('/');
    res.json({ message: err.message });
  }
});

router.post('/update/:id', upload, async (req, res) => {
  try {
    let id = req.params.id;
    let new_image = '';
    let old_image = req.body.old_image;

    if(req.file){
      new_image = req.file ? req.file.path : null;
      fs.unlink(old_image, (err) => {
        if(err) {
          console.log(err);
        } else {
          console.log("File removed successfully");
        }
      }); 
    } else {
      new_image = req.body.old_image;
    }
    const user = await User.findByIdAndUpdate(id, {
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      image: new_image,
    });

    req.session.message = {
      type: "success",
      message: "User updated successfully",
    };

    res.redirect('/');
    
  } catch (err) {
    res.json({ message: err.message, type: "danger" });
  }
});

//Delete user route
router.get('/delete/:id', async (req, res) => {
  try {
    let id = req.params.id;
    const result = await User.findByIdAndDelete(id);

    if (result && result.image) {
      fs.unlink(result.image, (err) => {
        if (err) {
          console.log("Error deleting file:", err);
        } else {
          console.log("File removed successfully");
        }
      });
    }

    req.session.message = {
      type: "success",
      message: "User deleted successfully",
    };
    res.redirect('/');

  } catch (err) {
    res.json({ message: err.message });
  }
});


module.exports = router;