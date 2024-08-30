import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column('uuid', { default: () => 'uuid_generate_v4()' })
    qid!: string;

    @Column()
    firstName!: string;

    @Column()
    lastName!: string;

    @Column()
    email!: string;

    @Column()
    picture!: string;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
    cts!: Date;

    @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
    ets!: Date;
}
