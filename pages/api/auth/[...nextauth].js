import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import * as bcrypt from "bcrypt";
import User from "../../../models/user";
import connectDB from "../../../middleware/mongodb";

export const authOptions = {
  secret: process.env.NextAuth_SECRET,
  providers: [
    CredentialsProvider({
      // The name to display on the sign in form (e.g. "Sign in with...")
      name: "Credentials",
      // `credentials` is used to generate a form on the sign in page.
      // You can specify which fields should be submitted, by adding keys to the `credentials` object.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        email: {
          label: "Email",
          type: "text",
          placeholder: "Enter email",
        },
        password: {
          label: "Password",
          type: "password",
          placeholder: "Enter Password",
        },
      },

      async authorize(credentials, req) {
        const { email, password } = credentials;

        const existingUserFunc = connectDB(async () => {
          const user = await User.findOne({ email });
          return user;
        });

        const existingUser = await existingUserFunc();

        console.log("existing", existingUser);

        if (!existingUser) {
          return res.status(400).json({ msg: `No user with email ${email}.` });
        }
        const validPass = await bcrypt.compare(password, existingUser.password);
        if (!validPass) {
          return res
            .status(400)
            .json({ msg: "Email and/or password is/are incorrect." });
        }
        // const res = await fetch("http://localhost:3000/api/login", {
        //   method: "POST",
        //   headers: {
        //     "Content-Type": "application/json",
        //   },
        //   body: JSON.stringify({
        //     email,
        //     password,
        //   }),
        // });
        // const user = await res.json();
        if (existingUser) {
          return existingUser;
        } else return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      return { ...token, ...user };
    },
    async session({ session, token, user }) {
      // Send properties to the client, like an access_token from a provider.
      session.user = token;
      return session;
    },
  },
  // pages: {
  //   signIn: "/auth/signin",
  // },
};

export default NextAuth(authOptions);
