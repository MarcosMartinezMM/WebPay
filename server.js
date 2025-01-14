require("dotenv").config();
const { SERVER_PORT, CLIENT_URL } = process.env;
const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
app.use(cors());

app.use(express.static("client"));

// Hardcoded Stripe Secret Key (not recommended for production)
const stripe = require("stripe")("sk_test_51Qgiu6Ht9MVkCivFkrB9epXXYsiZvKJ9qfvJTTNzP4Vmsli3da5RRo4Z3aQ8h3QCdfSts2ImirOCci5UkdpF1Fui00V0Qjj34x");

const quantity = 50;

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      success_url: `${CLIENT_URL}`,
      cancel_url: `${CLIENT_URL}`,
      line_items: [
        {
          price: "prod_RaTtpAxLJxsOQJ", // Ensure this price ID is correct
          quantity: quantity,
        },
      ],
      mode: "subscription",
    });
    console.log("session: ", session.id, session.url, session);

    // get id, save to user, return url
    const sessionId = session.id;
    console.log("sessionId: ", sessionId);

    // save session.id to the user in your database

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/stripe-session", async (req, res) => {
  console.log("req.body: ", req.body);
  const { userId } = req.body;
  console.log("userId: ", userId);

  const db = req.app.get("db");

  // get user from your database
  const user = {
    stripe_session_id: "asdfpouhwf;ljnqwfpqo",
    paid_sub: false,
  };

  if (!user.stripe_session_id || user.paid_sub === true)
    return res.send("fail");

  try {
    // check session
    const session = await stripe.checkout.sessions.retrieve(user.stripe_session_id);
    console.log("session: ", session);

    // update the user
    if (session && session.status === "complete") {
      let updatedUser = await db.update_user_stripe(userId, true);
      updatedUser = updatedUser[0];
      console.log(updatedUser);

      return res.send("success");
    } else {
      return res.send("fail");
    }
  } catch (error) {
    // handle the error
    console.error("An error occurred while retrieving the Stripe session:", error);
    return res.send("fail");
  }
});

const port = SERVER_PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
