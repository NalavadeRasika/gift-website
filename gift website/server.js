const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Middleware to check admin role
const isAdmin = (req, res, next) => {
  if (!req.session.admin) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};





// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });
const bcrypt = require('bcryptjs');

const app = express();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/giftshop', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: 'giftshop-secret-key',
  resave: false,
  saveUninitialized: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use("/uploads", express.static("public/uploads"));
app.use('/', router);


// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));



// Models
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');

// Create default admin
(async () => {
  try {
    const admin = await User.findOne({ email: 'test@gmail.com' });
    if (!admin) {
      const hashedPassword = await bcrypt.hash('test@123', 10);
      const newAdmin = new User({ 
        username: 'test@gmail.com', 
        email: 'test@gmail.com',
        password: hashedPassword,
        role: 'admin',
        name: 'Administrator'
      });
      await newAdmin.save();
      console.log('Default admin created');
    }
  } catch (err) {
    console.log(err);
  }
})();

// Routes
app.get('/', async (req, res) => {
  try {
    const products = await Product.find().limit(6);
    res.render('index', { products, session: req.session });
  } catch (err) {
    console.error('Home route error:', err);
    res.render('index', { products: [], session: req.session });
  }
});

app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.render('products', { products, session: req.session });
  } catch (err) {
    console.error('Products route error:', err);
    res.render('products', { products: [], session: req.session });
  }
});

app.get('/cart', (req, res) => {
  res.render('cart', { session: req.session });
});

app.get("/checkout", (req, res) => {
  res.render("checkout", { session: req.session });
});



app.get('/wishlist', (req, res) => {
  res.render('wishlist', { session: req.session });
});

app.get('/profile', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('profile', { session: req.session });
});

app.get('/orders', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('orders', { session: req.session, userId: req.session.user });
});

app.post('/api/checkout', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const { items, total, shippingAddress, paymentMethod } = req.body;
    const order = new Order({
      customer: req.session.user,
      items,
      total,
      shippingAddress,
      paymentMethod: paymentMethod || 'COD',
      status: 'Pending'
    });
    await order.save();
    res.json({ success: true, orderId: order._id });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Order failed', details: err.message });
  }
});



// User authentication routes
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ $or: [{ username }, { email: username }] });
    if (user && await bcrypt.compare(password, user.password)) {
      if (user.isBlocked) {
        return res.render('login', { error: 'Your account has been blocked. Please contact support.' });
      }
      req.session.user = user._id;
      req.session.username = user.username;
      if (user.role === 'admin') {
        req.session.admin = true;
      }
      res.redirect('/');
    } else {
      res.render('login', { error: 'Invalid credentials' });
    }
  } catch (err) {
    res.render('login', { error: 'Login failed' });
  }
});

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { username, email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.render('register', { error: 'Username or email already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, name });
    await newUser.save();
    req.session.user = newUser._id;
    req.session.username = newUser.username;
    res.redirect('/');
  } catch (err) {
    res.render('register', { error: 'Registration failed' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (user && user.role === 'admin' && await bcrypt.compare(password, user.password)) {
      req.session.admin = true;
      req.session.adminId = user._id;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin/login', { error: 'Invalid admin credentials' });
    }
  } catch (err) {
    res.render('admin/login', { error: 'Login failed' });
  }
});

app.get('/admin/dashboard', (req, res) => {
  if (!req.session.admin) return res.redirect('/admin/login');
  res.render('admin/dashboard');
});

app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin API endpoints
app.get('/admin/dashboard-data', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const products = await Product.find();
    const orders = await Order.find().populate('customer');
    const customers = await User.find({ role: 'user' });
    const coupons = await Coupon.find();
    
    res.json({
      products,
      orders,
      customers,
      coupons
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

app.get('/admin/analytics', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const orders = await Order.find();
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const monthlyRevenue = {};
    
    orders.forEach(o => {
      const month = new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + (o.total || 0);
    });
    
    res.json({
      totalRevenue,
      monthlyRevenue
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics' });
  }
});

// User API endpoints
app.get('/api/user/orders', async (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  try {
    const orders = await Order.find({ customer: req.session.user }).populate('items.product');
    res.json({ success: true, orders });
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.put('/admin/orders/:id/status', async (req, res) => {
  if (!req.session.admin) return res.status(401).json({ error: 'Unauthorized' });
  try {
    await Order.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// Admin routes
router.post("/admin/products", isAdmin, upload.single("image"), async (req,res)=>{
  try{
    const {name,price,stock,category,description} = req.body;

    const product = new Product({
      name,
      price,
      stock,
      category: category || "",
      description: description || "",
      image: req.file ? "/uploads/" + req.file.filename : ""
    });

    await product.save();
    res.json({success:true});
  }catch(err){
    console.error('Product creation error:', err);
    res.status(500).json({error:"Failed to create product"});
  }
});

router.put("/admin/products/:id", isAdmin, upload.single("image"), async (req,res)=>{
  try{
    const updateData = {
      name:req.body.name,
      price:req.body.price,
      stock:req.body.stock,
      category: req.body.category || "",
      description: req.body.description || ""
    };

    if(req.file){
      updateData.image = "/uploads/" + req.file.filename;
    }

    await Product.findByIdAndUpdate(req.params.id, updateData);
    res.json({success:true});
  }catch(err){
    console.error('Product update error:', err);
    res.status(500).json({error:"Failed to update product"});
  }
});

router.put("/admin/customers/:id/block", isAdmin, async (req,res)=>{
  try{
    await User.findByIdAndUpdate(req.params.id,{
      isBlocked:req.body.isBlocked
    });
    res.json({success:true});
  }catch(err){
    console.error('Block user error:', err);
    res.status(500).json({error:"Failed to update user status"});
  }
});

router.delete("/admin/customers/:id", isAdmin, async (req,res)=>{
  try{
    await User.findByIdAndDelete(req.params.id);
    res.json({success:true});
  }catch(err){
    console.error('Delete customer error:', err);
    res.status(500).json({error:"Failed to delete customer"});
  }
});

router.get("/admin/coupons", isAdmin, async (req,res)=>{
  try{
    const coupons = await Coupon.find().sort({createdAt:-1});
    res.json(coupons);
  }catch(err){
    console.error('Fetch coupons error:', err);
    res.status(500).json({error:"Failed to fetch coupons"});
  }
});


router.post("/admin/coupons", isAdmin, async (req,res)=>{
  try{
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.json({success:true});
  }catch(err){
    console.error('Create coupon error:', err);
    res.status(500).json({error:"Failed to create coupon"});
  }
});
 
router.put("/admin/coupons/:id/toggle", isAdmin, async (req,res)=>{
  try{
    const coupon = await Coupon.findById(req.params.id);
    if(!coupon) return res.status(404).json({error:"Coupon not found"});
    coupon.active = !coupon.active;
    await coupon.save();
    res.json({success:true});
  }catch(err){
    console.error('Toggle coupon error:', err);
    res.status(500).json({error:"Failed to toggle coupon"});
  }
});

router.delete("/admin/coupons/:id", isAdmin, async (req,res)=>{
  try{
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({success:true});
  }catch(err){
    console.error('Delete coupon error:', err);
    res.status(500).json({error:"Failed to delete coupon"});
  }
});


router.delete("/admin/products/:id", isAdmin, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

router.post("/apply-coupon", async (req,res)=>{
  try{
    const {code,total} = req.body;

    if(!code || !total) return res.json({error:"Missing required fields"});

    const coupon = await Coupon.findOne({code:code.toUpperCase()});

    if(!coupon) return res.json({error:"Invalid coupon"});
    if(!coupon.active) return res.json({error:"Coupon inactive"});
    if(new Date(coupon.expiry) < new Date())
      return res.json({error:"Coupon expired"});
    if(coupon.usedCount >= coupon.usageLimit)
      return res.json({error:"Coupon limit reached"});
    if(total < coupon.minOrder)
      return res.json({error:"Minimum order not met"});

    let discountAmount = 0;

    if(coupon.type==="percent"){
      discountAmount = total * (coupon.discount/100);
    }else{
      discountAmount = coupon.discount;
    }

    res.json({
      success:true,
      discount:discountAmount,
      finalTotal: total - discountAmount
    });
  }catch(err){
    console.error('Apply coupon error:', err);
    res.status(500).json({error:"Failed to apply coupon"});
  }
});


app.post('/api/wishlist-products', async (req, res) => {
  try {
    const { ids } = req.body;
    
    if(!ids || !Array.isArray(ids)) {
      return res.status(400).json({ success: false, error: "Invalid ids parameter" });
    }

    const products = await Product.find({
      _id: { $in: ids }
    });

    res.json({ success: true, products });
  } catch (error) {
    console.error('Wishlist products error:', error);
    res.status(500).json({ success: false, error: "Server error" });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});