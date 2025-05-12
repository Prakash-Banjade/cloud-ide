import { FindOptionsSelect } from "typeorm";
import { User } from "../entities/user.entity";

export const userSelectCols: FindOptionsSelect<User> = {
    id: true,
    createdAt: true,
    account: {
        firstName: true,
        lastName: true,
        email: true,
    }
}