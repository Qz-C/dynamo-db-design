import express, {Request, Response} from "express";
import { config as dotenvConfig } from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
import {connectDB, getMessageEntity, getUserEntity} from "./database";

dotenvConfig();

const { PORT=5000 }  = process.env;

const initServer = async () => {
    await connectDB();
    const app = express();

    app.use(cors());
    app.use(bodyParser.json());
    app.use(express.urlencoded({ extended: true }));

    const userEntity = getUserEntity();
    const messageEntity = getMessageEntity();

    app.post('/users/create', async (req: Request, res: Response) => {
        try{
            const user = req.body;
            const response = await userEntity.put(user).go();
            res.status(200).send(response);
        }catch (e){
            console.error(e);
            res.status(500).send({ error: "Failed to create user" });
        }
    });

    app.get('/users', async (req: Request, res: Response) => {
        try{
            const id = req.query.id;
            const response = await userEntity.query.byId({ id }).go();
            res.status(200).send(response);
        }catch (e){
            console.error(e);
            res.status(500).send({ error: "Failed to fetch user" });
        }
    })

    app.post('/messages', async (req: Request, res: Response) => {
        try{
            const message = req.body;
            const response = await messageEntity.put(message).go();
            res.status(200).send(response);
        }catch (e){
            console.error(e);
            res.status(500).send({ error: "Failed to create message" });
        }
    })

    app.get('/messages', async (req: Request, res: Response) => {
        try{
            const id = req.query.id;
            const response = await messageEntity.query.byId({ id }).go();
            res.status(200).send(response);
        }catch (e){
            console.error(e);
            res.status(500).send({ error: "Failed to fetch message" });
        }
    })

    app.get('/users/messages', async (req: Request, res: Response) => {
        try{
            const userId = req.query.user_id;
            const response = await messageEntity.query.byUser({ gsi1pk: `user#${userId}` }).go();
            res.status(200).send(response);
        }catch (e){
            console.error(e);
            res.status(500).send({ error: "Failed to fetch user messages" });
        }
    });

    app.listen(PORT, () => {
        console.log(`✅ Server is running on port ${PORT}`);
    });
}

initServer().catch((err: Error) => {
    console.error(err);
});