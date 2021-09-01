def resolve_sql_pipeline_for_combination(
    pipeline_or_domain,
    sql_query_retriever,
    sql_translate_pipeline,
    sql_query_describer_or_runner,
) -> str:
    """
    Combined pipelines can be either single domains (str), or complete pipeline (list of steps)
    """
    from weaverbird.pipeline import Pipeline

    if isinstance(pipeline_or_domain, str):
        return sql_query_retriever(pipeline_or_domain)
    else:
        # NOTE execution report of the sub-pipeline is discarded
        # For now return the domain name from first step as
        return sql_translate_pipeline(
            Pipeline(steps=pipeline_or_domain), sql_query_retriever, sql_query_describer_or_runner
        )[0]
