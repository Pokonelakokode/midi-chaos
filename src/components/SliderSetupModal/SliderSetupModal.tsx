import React, { useState } from 'react';
import styles from './SliderSetupModal.module.scss';

interface SliderSetupModalProps {
    onConfirm: (name: string, orientation: 'horizontal' | 'vertical') => void;
    onCancel: () => void;
    initialName?: string;
}

const SliderSetupModal: React.FC<SliderSetupModalProps> = ({ onConfirm, onCancel, initialName = '' }) => {
    const [name, setName] = useState(initialName);
    const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(name, orientation);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
                <h3>Add New Slider</h3>
                <form onSubmit={handleSubmit}>
                    <label>
                        <span className={styles.labelTitle}>Name</span>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Cutoff Filter"
                            autoFocus
                        />
                    </label>

                    <label>
                        <span className={styles.labelTitle}>Orientation</span>
                        <div className={styles.radioGroup}>
                            <label>
                                <input
                                    type="radio"
                                    value="horizontal"
                                    checked={orientation === 'horizontal'}
                                    onChange={() => setOrientation('horizontal')}
                                />
                                Horizontal
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="vertical"
                                    checked={orientation === 'vertical'}
                                    onChange={() => setOrientation('vertical')}
                                />
                                Vertical
                            </label>
                        </div>
                    </label>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancel} onClick={onCancel}>
                            Cancel
                        </button>
                        <button type="submit" className={styles.create}>
                            Create Slider
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SliderSetupModal;
