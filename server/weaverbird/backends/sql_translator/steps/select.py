from distutils import log

from weaverbird.backends.sql_translator.steps.utils.query_transformation import (
    build_selection_query,
)
from weaverbird.backends.sql_translator.types import (
    SQLPipelineTranslator,
    SQLQuery,
    SQLQueryDescriberOrRunner,
    SQLQueryRetriever,
)
from weaverbird.pipeline.steps import SelectStep


def translate_select(
    step: SelectStep,
    query: SQLQuery,
    index: int,
    sql_query_retriever: SQLQueryRetriever = None,
    sql_query_describer_or_runner: SQLQueryDescriberOrRunner = None,
    sql_translate_pipeline: SQLPipelineTranslator = None,
) -> SQLQuery:
    query_name = f'KEEPCOLS_STEP_{index}'

    log.debug(
        '############################################################'
        f'query_name: {query_name}\n'
        '------------------------------------------------------------'
        f'query.transformed_query: {query.transformed_query}\n'
        f'query.metadata_manager.query_metadata: {query.metadata_manager.retrieve_query_metadata()}\n'
    )

    cols_to_remove = [
        col
        for col in query.metadata_manager.retrieve_query_metadata_columns_as_list()
        if col not in step.columns
    ]
    for c in cols_to_remove:
        query.metadata_manager.remove_query_metadata_column(c)

    completed_fields = query.metadata_manager.retrieve_query_metadata_columns_as_str()

    return SQLQuery(
        query_name=query_name,
        transformed_query=f"""{query.transformed_query}, {query_name} AS (SELECT {
            completed_fields
        } FROM {query.query_name})""",
        selection_query=build_selection_query(
            query.metadata_manager.retrieve_query_metadata_columns(), query_name
        ),
        metadata_manager=query.metadata_manager,
    )
