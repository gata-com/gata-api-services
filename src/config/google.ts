import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import passport from "passport";
import { UserRepository } from "@/repositories/UserRepository";

const userRepository = new UserRepository();

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_REDIRECT_URI!,
    },
    async (
      accessToken: string,
      refreshToken: string,
      profile: any,
      done: any
    ) => {
      try {
        let user = await userRepository.repository.findOne({
          where: { googleId: profile.id },
        });

        if (user) {
          return done(null, user);
        }

        // User baru - tentukan role berdasarkan email atau domain
        let role: "student" | "lecturer" | "admin" = "student";
        const email = profile.emails?.[0]?.value;

        if (email?.endsWith("@if.itera.ac.id")) {
          role = "lecturer";
        }

        // email must be @student.itera.ac.id
        // if (!email?.endsWith("@student.itera.ac.id")) {
        //   return done(
        //     new Error("Email must be from student.itera.ac.id"),
        //     undefined
        //   );
        // }

        const newUser = await userRepository.createUserWithStudent(
          {
            googleId: profile.id,
            email: email,
            password: "",
            name: profile.displayName,
            role: role,
            is_active: true,
          },
          {}
        );
        done(null, newUser);
      } catch (error) {
        done(error as Error, undefined);
      }
    }
  )
);

passport.serializeUser((user: any, done: (err: any, id?: any) => void) => {
  done(null, user.id);
});

passport.deserializeUser(
  async (id: string, done: (err: any, user?: any) => void) => {
    try {
      const user = await userRepository.findById(parseInt(id, 10));
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
);

export default passport;
