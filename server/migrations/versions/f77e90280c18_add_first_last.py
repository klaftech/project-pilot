"""add first last

Revision ID: f77e90280c18
Revises: 9e356b708fd1
Create Date: 2025-04-17 01:07:39.377174

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f77e90280c18'
down_revision = '9e356b708fd1'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('first_name', sa.String(), nullable=True))
        batch_op.add_column(sa.Column('last_name', sa.String(), nullable=True))

    # Data migration (if you want to split 'name' into first and last)
    op.execute("""
        UPDATE users
        SET first_name = split_part(name, ' ', 1),
            last_name = split_part(name, ' ', 2)
    """)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('name')
        batch_op.alter_column('first_name', nullable=False)
        batch_op.alter_column('last_name', nullable=False)


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('name', sa.String(), nullable=True))

    # Merge first and last name back into 'name'
    op.execute("""
        UPDATE users
        SET name = first_name || ' ' || last_name
    """)

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('first_name')
        batch_op.drop_column('last_name')
        batch_op.alter_column('name', nullable=False)