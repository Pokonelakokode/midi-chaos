import React from 'react';
import { CCException } from '../../../types/types';
import styles from './CCExceptionBar.module.scss';

type Props = {
    exceptions: CCException[];
    setExceptions: (exceptions: CCException[]) => void;
}

const CCExceptionBar: React.FC<Props> = ({ exceptions, setExceptions }) => {

    return (
        <div className={styles.container}>
            {exceptions.map(exception => (
                <div key={exception.id} className={styles.exception}>
                    <span>CC# {exception.ccNumber}</span>
                    <span>Channel: {exception.channel}</span>
                    <button onClick={() => setExceptions(exceptions.filter(e => e.id !== exception.id))}>Remove</button>
                </div>
            )}
        </div>
    );
};

export default CCExceptionBar;