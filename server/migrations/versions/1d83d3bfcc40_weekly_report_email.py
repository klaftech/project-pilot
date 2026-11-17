"""weekly report email: users.weekly_report, report_deliveries

Revision ID: 1d83d3bfcc40
Revises: 46ce495999ad
Create Date: 2026-11-17 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '1d83d3bfcc40'
down_revision = '46ce495999ad'
branch_labels = None
depends_on = None


def upgrade():
    # server_default fills existing users with True, so everyone is opted in until they turn it off
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('weekly_report', sa.Boolean(), server_default=sa.true(), nullable=False))

    op.create_table('report_deliveries',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=False),
    sa.Column('period_end', sa.Date(), nullable=False),
    sa.Column('scope', sa.String(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('sent_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.id'], name=op.f('fk_report_deliveries_user_id_users'), ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id', name=op.f('pk_report_deliveries')),
    sa.UniqueConstraint('user_id', 'period_end', name=op.f('uq_report_deliveries_user_id'))
    )


def downgrade():
    op.drop_table('report_deliveries')

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('weekly_report')
